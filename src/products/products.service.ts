import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CronJob } from "cron";
import { PrismaService } from "../prisma/prisma.service";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateApprovalProductDto } from "./dto/approve-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { RequestUser } from "src/user/interface/user.interface";
import { productStatus, Role } from "@prisma/client";
import { SchedulerRegistry } from "@nestjs/schedule";
import { differenceInMilliseconds, formatISO, parse, subDays } from "date-fns";
import { UpdateVariantDto } from "./dto/update-variant.dto";
import { ProductGateway } from "./products.gatway";
import { MailerService } from "src/mailer/mailer.service";
import {
  getOtherCategoryNotificationEmailTemplate,
  getProductApprovalEmail,
  getProductRejectionEmail,
} from "src/utils/vendorEmailTemplates";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class ProductService {
  private readonly logger: Logger = new Logger(ProductService.name);
  private readonly DEFAULT_INVENTORY_TYPE_NAME = "CONSUMABLE";

  constructor(
    private prismaService: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
    private emailService: MailerService,
    private productGateway: ProductGateway,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  private ALL_SHIPPING_OPTIONS = [
    {
      type: "STANDARD",
      name: "Standard Shipping",
      description: "3-5 business days",
      upsCode: "GROUND",
    },
    {
      type: "PREMIUM",
      name: "Premium Shipping",
      description: "2-3 business days",
      upsCode: "2DAY",
    },
    {
      type: "LUXURY",
      name: "Luxury Shipping",
      description: "1-2 business days",
      upsCode: "2DAYAM",
    },
    {
      type: "EXPRESS",
      name: "Express Shipping",
      description: "Next business day",
      upsCode: "NEXTDAY",
    },
  ];

  private normalizeInventoryTypeName(value?: string): string | null {
    if (!value?.trim()) {
      return null;
    }

    return value.trim().toUpperCase();
  }

  private buildInventoryTypeProductFilter(inventoryType?: string) {
    const normalizedInventoryType = this.normalizeInventoryTypeName(inventoryType);
    if (!normalizedInventoryType) {
      return null;
    }

    if (normalizedInventoryType === this.DEFAULT_INVENTORY_TYPE_NAME) {
      return {
        OR: [
          {
            inventoryTypeRelation: {
              is: {
                name: normalizedInventoryType,
              },
            },
          },
          {
            inventoryTypeId: null,
          },
        ],
      };
    }

    return {
      inventoryTypeRelation: {
        is: {
          name: normalizedInventoryType,
        },
      },
    };
  }

  private async getDefaultInventoryTypeId(): Promise<string | null> {
    const consumableInventoryType = await this.prismaService.inventory_type.findFirst({
      where: {
        name: this.DEFAULT_INVENTORY_TYPE_NAME,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (consumableInventoryType) {
      return consumableInventoryType.id;
    }

    const firstActiveInventoryType = await this.prismaService.inventory_type.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    });

    return firstActiveInventoryType?.id ?? null;
  }

  private async resolveInventoryTypeSelection(input: {
    inventoryTypeId?: string;
    inventoryType?: string;
  }): Promise<{ inventoryTypeId: string }> {
    let resolvedInventoryTypeId = input.inventoryTypeId ?? null;
    const normalizedInventoryType = this.normalizeInventoryTypeName(input.inventoryType);

    if (input.inventoryTypeId) {
      const inventoryTypeRecord = await this.prismaService.inventory_type.findUnique({
        where: { id: input.inventoryTypeId },
        select: { id: true, name: true, isActive: true },
      });

      if (!inventoryTypeRecord) {
        throw new NotFoundException("Inventory type not found!");
      }

      if (!inventoryTypeRecord.isActive) {
        throw new BadRequestException("Selected inventory type is inactive.");
      }

      resolvedInventoryTypeId = inventoryTypeRecord.id;
    } else if (normalizedInventoryType) {
      const inventoryTypeRecord = await this.prismaService.inventory_type.findFirst({
        where: { name: normalizedInventoryType, isActive: true },
        select: { id: true },
      });

      if (inventoryTypeRecord) {
        resolvedInventoryTypeId = inventoryTypeRecord.id;
      }
    }

    if (!resolvedInventoryTypeId) {
      resolvedInventoryTypeId = await this.getDefaultInventoryTypeId();
    }

    if (!resolvedInventoryTypeId) {
      throw new BadRequestException(
        "No active inventory type found. Please create an inventory type first.",
      );
    }

    return {
      inventoryTypeId: resolvedInventoryTypeId,
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private async generateUniqueSlug(
    title?: string,
    fallbackTitle?: string,
    currentProductId?: string,
  ): Promise<string> {
    const sourceText = title?.trim() || fallbackTitle?.trim() || "product";
    const baseSlug = this.slugify(sourceText) || "product";
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const existingProduct = await this.prismaService.product.findFirst({
        where: {
          slug,
          ...(currentProductId ? { id: { not: currentProductId } } : {}),
        } as any,
        select: {
          id: true,
        },
      });

      if (!existingProduct) {
        return slug;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  async createProduct(productData: CreateProductDto) {
    try {
      // const subCategory = await this.prismaService.subCategory.findUnique({
      //   where: {
      //     id: productData.subCategoryId,
      //   },
      // });

      // if (!category) {
      //   throw new BadRequestException("Sub Category does not exist!");
      // }

      const category = await this.prismaService.category.findMany({
        where: {
          id: { in: productData.categoryId },
        },
      });

      if (category.length !== productData.categoryId.length) {
        throw new BadRequestException("Some categories do not exist");
      }

      if (productData.material) {
        const material = await this.prismaService.material.findUnique({
          where: {
            id: productData.material,
          },
        });
        if (!material) {
          throw new NotFoundException("Material does not found!");
        }
      }

      if (productData.vendorId) {
        const vendor = await this.prismaService.vendors.findUnique({
          where: {
            id: productData.vendorId,
          },
        });
        if (!vendor) {
          throw new NotFoundException("Vendor does not found!");
        }
      }

      if (productData?.deliveryOptions) {
        const invalidOptions = productData.deliveryOptions.filter(
          (option) => !this.ALL_SHIPPING_OPTIONS.some((o) => o.type === option),
        );

        if (invalidOptions.length > 0) {
          throw new BadRequestException(
            `Invalid shipping options: ${invalidOptions.join(", ")}`,
          );
        }
      }

      const resolvedInventoryType = await this.resolveInventoryTypeSelection({
        inventoryTypeId: productData.inventoryTypeId,
        inventoryType: productData.inventoryType,
      });

      const generatedSlug = await this.generateUniqueSlug(
        productData.title,
        productData.descriptiveTitle,
      );

      const skuData = await this.generateSKU();
      const requiredObject: any = {
        title: productData.title,
        descriptiveTitle: productData.descriptiveTitle,
        slug: generatedSlug,
        totalSold: 0,
        totalReviews: 0,
        rating: productData?.rating ?? "",
        images: productData.images,
        bannerImage: productData?.bannerImage ?? null,
        video: productData.video ?? null,
        description: productData.description,
        featured: productData.featured ?? false,
        approved: productData.approved ?? false,
        quantity: productData.variants?.length
          ? undefined
          : productData.quantity,
        manufacturer: productData.manufacturer,
        packaging: productData.packaging ?? "",
        type: productData.type ?? "",
        width: productData?.width ?? "0",
        height: productData?.height ?? "0",
        length: productData?.length ?? "0",
        weight: productData?.weight ?? "0",
        vasoconstrictor: productData.vasoconstrictor ?? "",
        sds: productData.sds ?? "",
        style: productData.style ?? "",
        sterility: productData.sterility ?? "",
        properties: productData.properties ?? "",
        construction: productData.construction ?? "",
        dilutionRatio: productData.dilutionRatio ?? "",
        // subCategoryId: productData.subCategoryId,

        categories: {
          create: productData.categoryId.map((id) => ({
            category: {
              connect: { id },
            },
          })),
        },
        // 
        vendorId: productData.vendorId,
        brand: productData.brand ?? null,
        materialId: productData.material ?? null,
        scent: productData.scent ?? "",
        viscosity: productData.viscosity ?? "",
        fluidResistance: productData.fluidResistance ?? "",
        filtrationRate: productData.filtrationRate ?? "",
        isLicenseRequired: productData?.isLicenseRequired ?? false,
        deliveryOptions: productData.deliveryOptions || ["STANDARD"],
        isActive: productData.isActive ?? true,
        shippingMethod: productData.shippingMethod,
        flatRate:
          productData.shippingMethod === "FLAT" ? productData.flatRate : 0,
        inventoryTypeId: resolvedInventoryType.inventoryTypeId,
        variants: productData.variants?.length
          ? {
            create: productData.variants.map((variant) => ({
              color: variant.color,
              size: variant.size,
              images: variant.images,
              quantity: variant.quantity,
              price: variant.price,
              discount: variant.discount ?? 0,
              discountedPrice:
                variant.discountedPrice ??
                (variant.discount
                  ? parseFloat(
                    (variant.price * (1 - variant.discount / 100)).toFixed(
                      2,
                    ),
                  )
                  : variant.price),
              sku: skuData,
              barCode: variant.barCode ?? null,
              endingDate: variant.endingDate
                ? formatISO(
                  parse(variant.endingDate, "yyyy-MM-dd", new Date()),
                )
                : null,
              attributes: variant.attributes?.length
                ? {
                  create: variant.attributes.map((attr: any) => ({
                    name: attr.name,
                    value: attr.value,
                  })),
                }
                : undefined,
            })),
          }
          : undefined,
      };

      const createdProduct = await this.prismaService.product.create({
        data: requiredObject,
        include: {
          variants: true,
          vendor: {
            include: {
              admin: true,
            },
          },
        },
      });

      for (let variant of productData.variants) {
        if (variant.endingDate) {
          const targetDate = new Date(variant.endingDate);
          const now = new Date();
          const jobName = `job-${createdProduct.id}`;

          const timeDifference = differenceInMilliseconds(targetDate, now);

          if (timeDifference > 0) {
            const job = new CronJob(targetDate, async () => {
              await this.updateVariant(
                createdProduct.id,
                createdProduct.vendorId,
                {
                  endingDate: null,
                  discount: 0,
                  discountedPrice: 0,
                },
              );
              this.schedulerRegistry.deleteCronJob(jobName);
            });
            this.schedulerRegistry.addCronJob(jobName, job);
            job.start();
          }
        }
      }

      // if (subCategory?.name === "Other") {
      //   const vendor = await this.prismaService.vendors.findUnique({
      //     where: { id: productData?.vendorId },
      //     include: {
      //       admin: true,
      //     },
      //   });

      //   if (vendor?.admin?.email) {
      //     await this.emailService.sendEmail(
      //       vendor.admin.email,
      //       `New Product Created by ${vendor.firstName} ${vendor.lastName}`,
      //       getOtherCategoryNotificationEmailTemplate(
      //         productData,
      //         subCategory.name,
      //       ),
      //     );
      //   }
      // }

      this.eventEmitter.emit("product.created", { product: createdProduct });

      return {
        data: createdProduct,
        message: "Product has been created successfully!",
      };
    } catch (error) {
      this.logger.error("Error creating product", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async generateSKU(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uuidPart = uuidv4().split("-")[0].toUpperCase();
    return `SKU-${timestamp}-${uuidPart}`;
  }

  async findAllLight(
    searchTerm: string = "",
    page: number = 1,
    limit: number = 10,
    officeId?: string,
    onlyInInventory: boolean = false,
    inventoryType?: string,
    user?: any
  ) {
    try {
      const skip = (page - 1) * limit;
      const filters: any = {};

      if (searchTerm?.trim()) {
        filters.OR = [
          {
            title: {
              contains: searchTerm.trim(),
              mode: "insensitive",
            },
          },
          {
            id: {
              contains: searchTerm.trim(),
              mode: "insensitive",
            },
          },
        ];
      }

      const inventoryTypeFilter = this.buildInventoryTypeProductFilter(inventoryType);
      if (inventoryTypeFilter) {
        filters.AND = [...(filters.AND || []), inventoryTypeFilter];
      }

      // If officeId is provided, ONLY fetch products with net stock > 0 in that office
      if (officeId) {
        const clientId = (!user?.is_system_admin && user?.client_id) ? user.client_id : null;
        const stockData: any[] = clientId
          ? await this.prismaService.$queryRaw`
              SELECT i."productId", SUM(CASE
                WHEN i."transaction_type" = 'IN' THEN i.quantity
                ELSE -i.quantity
              END) as stock
              FROM "Inventory" i
              JOIN "Office" o ON i."office_id" = o."office_id"
              WHERE i."office_id" = ${officeId}::uuid
                AND i."status" != 'INACTIVE'
                AND i."productId" IS NOT NULL
                AND o."client_id" = ${clientId}::uuid
              GROUP BY i."productId"
              HAVING SUM(CASE
                WHEN i."transaction_type" = 'IN' THEN i.quantity
                ELSE -i.quantity
              END) > 0
            `
          : await this.prismaService.$queryRaw`
              SELECT "productId", SUM(CASE
                WHEN "transaction_type" = 'IN' THEN quantity
                ELSE -quantity
              END) as stock
              FROM "Inventory"
              WHERE "office_id" = ${officeId}::uuid
                AND "status" != 'INACTIVE'
                AND "productId" IS NOT NULL
              GROUP BY "productId"
              HAVING SUM(CASE
                WHEN "transaction_type" = 'IN' THEN quantity
                ELSE -quantity
              END) > 0
            `;

        const stockMap = new Map(stockData.map((s) => [s.productId, Number(s.stock)]));
        // Custom-product ledger rows have a null productId — never put null into an `id in` filter.
        const productIds = Array.from(stockMap.keys()).filter((id): id is string => id != null);
        filters.id = { in: productIds };

        const products = await this.prismaService.product.findMany({
          where: filters,
          orderBy: { createdAt: "desc" },
          skip: skip,
          take: limit,
          select: {
            id: true,
            title: true,
            isActive: true,
            createdAt: true,
            brand: true,
            inventoryTypeId: true,
            inventoryTypeRelation: {
              select: {
                name: true,
              },
            },
            variants: {
              select: {
                id: true,
                price: true,
                sku: true,
                barCode: true,
              },
            },
          },
        });

        const totalProducts = await this.prismaService.product.count({
          where: filters,
        });

        const productsWithStock = products.map((p) => ({
          ...p,
          inventoryType:
            p.inventoryTypeRelation?.name ||
            (p.inventoryTypeId ? "" : this.DEFAULT_INVENTORY_TYPE_NAME),
          stock: stockMap.get(p.id) || 0,
        }));

        return {
          data: productsWithStock,
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
          totalProducts,
        };
      } else if (onlyInInventory) {
        // If no officeId but onlyInInventory requested, filter products that have ANY inventory record
        const invFilter: any = { status: { not: "INACTIVE" } };
        if (user && !user.is_system_admin && user.client_id) {
          invFilter.office = { client_id: user.client_id };
        }
        filters.inventoryItems = { some: invFilter };
      }

      const products = await this.prismaService.product.findMany({
        where: filters,
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: limit,
        select: {
          id: true,
          title: true,
          isActive: true,
          createdAt: true,
          brand: true,
          inventoryTypeId: true,
          inventoryTypeRelation: {
            select: {
              name: true,
            },
          },
          variants: {
            select: {
              id: true,
              price: true,
              sku: true,
              barCode: true,
            },
          },
        },
      });

      const totalProducts = await this.prismaService.product.count({
        where: filters,
      });

      const normalizedProducts = products.map((p) => ({
        ...p,
        inventoryType:
          p.inventoryTypeRelation?.name ||
          (p.inventoryTypeId ? "" : this.DEFAULT_INVENTORY_TYPE_NAME),
      }));

      return {
        data: normalizedProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
      };
    } catch (error) {
      this.logger.error("Error fetching light products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async approveProducts(
    productId: string,
    updateApproval: UpdateApprovalProductDto,
  ) {
    try {
      const productVendor = await this.prismaService.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          vendor: true,
        },
      });
      if (!productVendor) {
        throw new NotFoundException("Product not found!");
      }
      if (!productVendor.vendor) {
        throw new NotFoundException("Vendor not found!");
      }
      if (updateApproval.status === "REJECT") {
        if (!updateApproval.reason) {
          throw new BadRequestException("Please provide a rejection reason!");
        }
      }
      const updatedProduct = await this.prismaService.product.update({
        where: { id: productId },
        data: {
          approved: updateApproval.status === "APPROVE",
          status: updateApproval.status,
          reason: updateApproval.reason ?? "",
        },
      });

      const sideEffectErrors: string[] = [];

      if (updateApproval.status === "REJECT") {
        const emailContent = getProductRejectionEmail(
          productVendor.vendor.firstName,
          productVendor.vendor.lastName,
          updateApproval.reason,
        );

        try {
          await this.emailService.sendEmail(
            productVendor.vendor.email,
            `Product Approval Status: REJECTED`,
            emailContent,
          );
        } catch (notificationError) {
          this.logger.warn(
            `Product status updated to REJECT but email failed for product ${productId}: ${notificationError?.message || notificationError}`,
          );
          sideEffectErrors.push("REJECT_EMAIL_FAILED");
        }
      } else if (updateApproval.status === "APPROVE") {
        const emailContent = getProductApprovalEmail(
          productVendor.vendor.firstName,
          productVendor.vendor.lastName,
          updatedProduct.title,
        );

        try {
          await this.emailService.sendEmail(
            productVendor.vendor.email,
            `Product Approval Status: APPROVED`,
            emailContent,
          );
        } catch (notificationError) {
          this.logger.warn(
            `Product status updated to APPROVE but email failed for product ${productId}: ${notificationError?.message || notificationError}`,
          );
          sideEffectErrors.push("APPROVE_EMAIL_FAILED");
        }
      }

      try {
        this.eventEmitter.emit("update.product", {
          product: updatedProduct,
          previousStatus: productVendor.status,
        });
      } catch (emitError) {
        this.logger.warn(
          `Product status updated but event emission failed for product ${productId}: ${emitError?.message || emitError}`,
        );
        sideEffectErrors.push("EVENT_EMIT_FAILED");
      }

      const messages: Record<string, string> = {
        APPROVE: "The product has been successfully approved.",
        PENDING: "The product is under pending review.",
        REJECT: "The product has been rejected.",
      };

      if (updatedProduct.approved) {
        try {
          this.productGateway.emitProductModification(updatedProduct);
        } catch (gatewayError) {
          this.logger.warn(
            `Product status updated but gateway emit failed for product ${productId}: ${gatewayError?.message || gatewayError}`,
          );
          sideEffectErrors.push("GATEWAY_EMIT_FAILED");
        }
      }

      return {
        message: messages[updateApproval.status],
        data: updatedProduct,
        ...(sideEffectErrors.length > 0
          ? {
            warning:
              "Product status was updated, but one or more notifications could not be sent.",
            sideEffectErrors,
          }
          : {}),
      };
    } catch (error) {
      this.logger.error("Error fetching finding products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAllVerifiedProducts(
    vendorId: string,
    searchTerm: string,
    approved: boolean | string,
    page: number,
    limit: number,
    status?: string,
    categoryArray: string[] = [],
  ) {
    try {
      const skip = (page - 1) * limit;
      const filters: any = { vendorId };

      if (searchTerm?.trim()) {
        const s = searchTerm.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const AND: any[] = [];

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          AND.push({
            createdAt: { gte: start, lte: end },
          });
        } else {
          const OR: any[] = [
            {
              title: {
                contains: s,
                mode: "insensitive",
              },
            },
            {
              id: {
                contains: s,
                mode: "insensitive",
              },
            },
          ];

          AND.push({ OR });
        }

        if (AND.length > 0) {
          filters.AND = AND;
        }
      }

      const validateStatus = [
        productStatus.APPROVE,
        productStatus.PENDING,
        productStatus.REJECT,
      ];
      if (status && validateStatus.includes(status as productStatus)) {
        filters.status = status;
      }

      if ((approved === true || approved === false) && approved !== undefined) {
        filters.approved = approved || false;
      }

      // Filter by category IDs when provided
      if (categoryArray.length > 0) {
        filters.categories = {
          some: {
            categoryId: {
              in: categoryArray,
            },
          },
        };
      }

      const verifiedProduct = await this.prismaService.product.findMany({
        where: filters,
        skip: skip,
        take: limit,
        include: {
          // subCategory: {
          //   include: {
          //     category: true,
          //   },
          // },
          categories: {
            include: {
              category: true
            }
          },
          variants: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const totalProducts = await this.prismaService.product.count({
        where: filters,
      });
      return {
        data: verifiedProduct,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts: totalProducts,
      };
    } catch (error) {
      this.logger.error("Error fetching finding products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAssignedVendorsProducts(
    adminId: string,
    approved: boolean | string,
    page: number,
    limit: number,
    searchTerm: string,
    status?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const admin = await this.prismaService.admin.findUnique({
        where: { id: adminId },
        include: {
          vendors: true,
        },
      });

      //  if (!admin || !admin.vendors.length) {
      //   throw new NotFoundException("No vendors found for this admin.");
      if (!admin) {
        throw new NotFoundException(`No vendors found for this admin.`);
      }

      if (!admin.vendors.length) {
        return {
          data: [],
          currentPage: page,
          totalPages: 0,
          totalProducts: 0,
        };
      }

      const vendorIds = admin.vendors.map((vendor) => vendor.id);
      searchTerm = searchTerm?.trim();

      const filters: any = {
        vendorId: {
          in: vendorIds,
        },
        OR: [
          {
            title: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
          {
            id: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
        ],
      };

      const validateStatus = [
        productStatus.APPROVE,
        productStatus.PENDING,
        productStatus.REJECT,
      ];
      if (status && validateStatus.includes(status as productStatus)) {
        filters.status = status;
      }

      if ((approved === true || approved === false) && approved !== undefined) {
        filters.approved = approved || false;
      }

      const parsedDate = new Date(searchTerm);
      if (!isNaN(parsedDate.getTime())) {
        filters.OR.push({
          createdAt: {
            gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
            lte: new Date(parsedDate.setHours(23, 59, 59, 999)),
          },
        });
      }

      const products = await this.prismaService.product.findMany({
        where: filters,
        skip: skip,
        take: limit,
        include: {
          variants: true,
          material: true,
          categories: {
            include: {
              category: true
            }
          },
          // subCategory: {
          //   include: {
          //     category: true,
          //   },
          // },
          vendor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const totalProducts = await this.prismaService.product.count({
        where: filters,
      });

      return {
        data: products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts: totalProducts,
      };
    } catch (error) {
      this.logger.error("Error fetching assigned Vendor products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getVariantAttributes(): Promise<Record<string, { value: string; count: number }[]>> {
    try {
      const approvedProductWhere = { status: productStatus.APPROVE };
      const counters: Record<string, Record<string, Set<string>>> = {};

      const addCount = (
        name: string | null | undefined,
        value: string | null | undefined,
        productId: string,
      ) => {
        const normalizedName = name?.trim().toLowerCase();
        const normalizedValue = value?.trim().toLowerCase();
        if (!normalizedName || !normalizedValue || !productId) return;

        counters[normalizedName] ??= {};
        counters[normalizedName][normalizedValue] ??= new Set<string>();
        counters[normalizedName][normalizedValue].add(productId);
      };

      const [attributes, variants] = await Promise.all([
        this.prismaService.variantAttribute.findMany({
          where: {
            variant: {
              product: approvedProductWhere,
            },
          },
          select: {
            name: true,
            value: true,
            variant: {
              select: {
                productId: true,
              },
            },
          },
        }),
        this.prismaService.productVariant.findMany({
          where: {
            product: approvedProductWhere,
          },
          select: {
            productId: true,
            color: true,
            size: true,
          },
        }),
      ]);

      attributes.forEach((attr) => {
        addCount(attr.name, attr.value, attr.variant.productId);
      });

      variants.forEach((variant) => {
        addCount("color", variant.color, variant.productId);
        addCount("size", variant.size, variant.productId);
      });

      const grouped: Record<string, { value: string; count: number }[]> = {};
      Object.entries(counters).forEach(([name, valueMap]) => {
        grouped[name] = Object.entries(valueMap)
          .map(([value, productIds]) => ({ value, count: productIds.size }))
          .sort((a, b) =>
            a.value.localeCompare(b.value, undefined, { sensitivity: "base" }),
          );
      });

      return grouped;
    } catch (error) {
      this.logger.error("Error fetching variant attributes", error);
      throw handlePrismaError(error);
    }
  }

  async findAllProducts(
    searchTerm: string = "",
    page: number,
    limit: number,
    categoryArray: string[] = [],
    minPrice: number,
    maxPrice: number,
    vendorFirstName: string = "",
    vendorLastName: string = "",
    minRating: number,
    discount: boolean,
    featured: boolean,
    brandArray: string[] = [],
    material: string,
    recent: boolean,
    // subCategoryArray: string[] = [],
    rating: string,
    sortBy: string,
    approved?: boolean,
    status?: string,
    isActive?: boolean,
    attributes?: string,
    inventoryType?: string
  ) {
    try {
      const skip = (page - 1) * limit;
      searchTerm = searchTerm?.trim();
      const filters: any = {
        OR: [
          {
            title: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
          {
            id: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
        ],
      };
      const parsedDate = new Date(searchTerm);
      if (!isNaN(parsedDate.getTime())) {
        filters.OR.push({
          createdAt: {
            gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
            lte: new Date(parsedDate.setHours(23, 59, 59, 999)),
          },
        });
      }

      const validateStatus = [
        productStatus.APPROVE,
        productStatus.PENDING,
        productStatus.REJECT,
      ];
      if (approved === true) {
        filters.status = productStatus.APPROVE;
      } else if (approved === false) {
        filters.status = { in: [productStatus.PENDING, productStatus.REJECT] };
      }

      if (status && validateStatus.includes(status as productStatus)) {
        if (filters.status) {
          filters.status = {
            in: Array.isArray(filters.status?.in)
              ? [...filters.status.in, status]
              : [filters.status, status],
          };
        } else {
          filters.status = status;
        }
      }

      if (brandArray.length > 0) {
        filters.brand = {
          in: brandArray,
        };
      }

      if (material) {
        filters.material = {
          name: material,
        };
      }

      if (rating) {
        filters.rating = rating;
      }

      if (discount) {
        filters.variants = {
          some: {
            discount: {
              gt: 0,
            },
          },
        };
      }

      if (featured) {
        filters.featured = true;
      }



      // if (subCategoryArray.length > 0) {
      //   filters.subCategory = {
      //     name: {
      //       in: subCategoryArray,
      //       mode: "insensitive",
      //     },
      //   };
      // }

      // old code
      // if (categoryArray.length > 0) {
      //   filters.categories = {
      //     some: {
      //       category: {
      //         name: {
      //           in: categoryArray,
      //           mode: "insensitive",
      //         },
      //       },
      //     },
      //   };
      // }

      // New Many-to-Many logic to fetch products under the exact category OR its sub-category
      // Supports both category names and slugs for SEO-friendly URL routing
      if (categoryArray.length > 0) {
        filters.categories = {
          some: {
            category: {
              OR: [
                {
                  name: {
                    in: categoryArray,
                    mode: "insensitive",
                  },
                },
                {
                  slug: {
                    in: categoryArray,
                  },
                },
                {
                  parent: {
                    name: {
                      in: categoryArray,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  parent: {
                    slug: {
                      in: categoryArray,
                    },
                  },
                },
              ],
            },
          },
        };
      }

      if (minPrice && maxPrice) {
        filters.variants = {
          some: {
            price: {
              gte: minPrice,
              lte: maxPrice,
            },
          },
        };
      } else if (minPrice) {
        filters.variants = {
          some: {
            price: {
              gte: minPrice,
            },
          },
        };
      } else if (maxPrice) {
        filters.variants = {
          some: {
            price: {
              lte: maxPrice,
            },
          },
        };
      }

      if (vendorFirstName || vendorLastName) {
        filters.vendor = {
          AND: [],
        };
        if (vendorFirstName) {
          filters.vendor.AND.push({
            firstName: {
              contains: vendorFirstName,
              mode: "insensitive",
            },
          });
        }
        if (vendorLastName) {
          filters.vendor.AND.push({
            lastName: {
              contains: vendorLastName,
              mode: "insensitive",
            },
          });
        }
      }

      if (minRating) {
        filters.reviews = {
          some: {
            rating: {
              gte: minRating.toString(),
            },
          },
        };
      }
      let orderBy = {};

      if (recent) {
        orderBy = { createdAt: "desc" };
      }

      if (sortBy === "bestSeller") {
        orderBy = {
          totalSold: "desc",
        };
      } else if (sortBy === "highRated") {
        orderBy = {
          totalReviews: "desc",
        };
      } else {
        orderBy = { createdAt: "desc" };
      }

      if (isActive === true) {
        filters.isActive = true;
      }

      if (attributes) {
        const grouped = attributes.split(",").reduce(
          (acc, pair) => {
            const [rawName, rawValue] = pair.split(":");
            if (!rawName || !rawValue) return acc;

            const name = decodeURIComponent(rawName.trim()).toLowerCase();
            const value = decodeURIComponent(rawValue.trim());
            if (!value) return acc;

            if (!acc[name]) acc[name] = [];
            acc[name].push(value);
            return acc;
          },
          {} as Record<string, string[]>,
        );

        const attrFilters = Object.entries(grouped).map(([name, values]) => {
          if (name === "color" || name === "size") {
            return {
              variants: {
                some: {
                  [name]: { in: values, mode: "insensitive" },
                },
              },
            };
          }

          return {
            variants: {
              some: {
                attributes: {
                  some: {
                    name: { equals: name, mode: "insensitive" },
                    OR: values.map((value) => ({
                      value: { equals: value, mode: "insensitive" },
                    })),
                  },
                },
              },
            },
          };
        });

        if (attrFilters.length) {
          filters.AND = [...(filters.AND || []), ...attrFilters];
        }
      }

      const inventoryTypeFilter = this.buildInventoryTypeProductFilter(inventoryType);
      if (inventoryTypeFilter) {
        filters.AND = [...(filters.AND || []), inventoryTypeFilter];
      }
      const isCustomSort = sortBy === "lowPrice" || sortBy === "percentSaving";

      const allProducts = await this.prismaService.product.findMany({
        where: filters,
        skip: isCustomSort ? undefined : skip,
        take: isCustomSort ? undefined : limit,
        orderBy,
        include: {
          variants: true,
          // subCategory: {
          //   include: {
          //     category: true,
          //   },
          // },
          categories: {
            include: {
              category: {
                include: {
                  parent: true,
                },
              },
            }
          },
          material: true,
          reviews: true,
          vendor: true,
          promotions: true,
        },
      });

      let sortedProducts = allProducts;

      if (sortBy === "lowPrice") {
        sortedProducts = allProducts.sort((a, b) => {
          const minPriceA = Math.min(
            ...a.variants.map((v) => v.discountedPrice ?? v.price),
          );
          const minPriceB = Math.min(
            ...b.variants.map((v) => v.discountedPrice ?? v.price),
          );
          return minPriceA - minPriceB;
        });
      } else if (sortBy === "percentSaving") {
        sortedProducts = allProducts.sort((a, b) => {
          const maxDiscountA = Math.max(...a.variants.map((v) => v.discount ?? 0));
          const maxDiscountB = Math.max(...b.variants.map((v) => v.discount ?? 0));
          return maxDiscountB - maxDiscountA;
        });
      }

      let filteredProducts = sortedProducts
        .map((product) => {
          const filteredVariants = product.variants.filter((variant) => {
            const passesDiscount = !discount || variant.discount > 0;

            const passesPrice =
              (!minPrice || variant.price >= minPrice) &&
              (!maxPrice || variant.price <= maxPrice);

            return passesDiscount && passesPrice;
          });

          return {
            ...product,
            variants: filteredVariants,
          };
        })
        .filter((product) => product.variants.length > 0);

      const totalProducts = await this.prismaService.product.count({
        where: filters,
      });

      if (isCustomSort) {
        filteredProducts = filteredProducts.slice(skip, skip + limit);
      }

      return {
        data: filteredProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts: totalProducts,
      };
    } catch (error) {
      this.logger.error("Error fetching products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteProduct(
    productId: string | string[],
    loggedInVendor: RequestUser,
  ) {
    try {
      if (!loggedInVendor) {
        throw new NotFoundException("User not found!");
      }

      const productIdArray = (Array.isArray(productId)
        ? productId
        : productId.split(","))
        .map((id) => id?.trim())
        .filter(Boolean);

      const role = (loggedInVendor.role || "").toUpperCase();
      const isSuperAdmin = role === Role.SUPER_ADMIN || role === "SYSTEM_ADMIN";
      const isVendor = role === Role.VENDOR;

      if (productIdArray.length === 0) {
        throw new BadRequestException("No valid product ids provided for deletion.");
      }

      const productDetail = await this.prismaService.product.findMany({
        where: {
          id: { in: productIdArray },
          ...(isVendor ? { vendorId: loggedInVendor.id } : {}),
        },
        include: {
          variants: {
            include: {
              orders: {
                where: {
                  status: {
                    in: [
                      "PLACED",
                      "PACKED",
                      "DELIVERED",
                      "INPROGRESS",
                      "SHIPPED",
                      "RETURNED",
                      "CANCELED",
                    ],
                  },
                },
              },
            },
          },
        },
      });

      if (productDetail.length === 0) {
        throw new NotFoundException("No products found for deletion.");
      }

      if (isVendor && productDetail.length !== productIdArray.length) {
        throw new ForbiddenException("Vendors can delete only their own products.");
      }

      const isDeletableByStatusOrStock = (product: any) => {
        const totalStock =
          product.variants?.reduce(
            (total: number, variant: any) => total + (variant.quantity || 0),
            0,
          ) || 0;
        return (
          product.status === productStatus.PENDING ||
          product.status === productStatus.REJECT ||
          totalStock === 0
        );
      };

      const eligibleProducts = isSuperAdmin
        ? productDetail
        : productDetail.filter((product) => isDeletableByStatusOrStock(product));

      if (!isSuperAdmin) {
        const nonDeletableProducts = productDetail.filter(
          (product) => !isDeletableByStatusOrStock(product),
        );

        if (nonDeletableProducts.length > 0) {
          const titles = nonDeletableProducts
            .map((p) => {
              const totalStock =
                p.variants?.reduce(
                  (total: number, variant: any) => total + (variant.quantity || 0),
                  0,
                ) || 0;
              return `${p.title} (status: ${p.status}, stock: ${totalStock})`;
            })
            .join(", ");
          throw new BadRequestException(
            `Vendors can delete only pending/reject or zero-stock products. Blocked: ${titles}`,
          );
        }
      }

      const productsInUse = [];
      const deletableProducts = [];

      for (const product of eligibleProducts) {
        const hasActiveOrders = product.variants.some(
          (variant) => variant.orders.length > 0,
        );
        if (hasActiveOrders && !isSuperAdmin) {
          productsInUse.push(product.title);
        } else {
          deletableProducts.push(product);
        }
      }

      if (productsInUse.length > 0) {
        const titles = productsInUse.join(", ");
        throw new BadRequestException(
          productsInUse.length === 1
            ? `This product cannot be deleted because it is linked to order history: ${titles}.`
            : `Some products cannot be deleted because they are linked to order history: ${titles}.`,
        );
      }

      const variantIds = deletableProducts.flatMap((product) =>
        product.variants.map((variant) => variant.id),
      );

      // if (variantIds.length > 0) {
      //   const autoOrders = await this.prismaService.autoOrder.findMany({
      //     where: {
      //       variantId: {
      //         in: variantIds,
      //       },
      //     },
      //     select: {
      //       id: true,
      //     },
      //   });

      //   const autoOrderIds = autoOrders.map((item) => item.id);

      //   if (autoOrderIds.length > 0) {
      //     await this.prismaService.orders.updateMany({
      //       where: {
      //         autoOrderId: {
      //           in: autoOrderIds,
      //         },
      //       },
      //       data: {
      //         autoOrderId: null,
      //       },
      //     });

      //     await this.prismaService.autoOrderItems.deleteMany({
      //       where: {
      //         autoOrderId: {
      //           in: autoOrderIds,
      //         },
      //       },
      //     });

      //     await this.prismaService.autoOrder.deleteMany({
      //       where: {
      //         id: {
      //           in: autoOrderIds,
      //         },
      //       },
      //     });
      //   }

      //   if (isSuperAdmin) {
      //     await this.prismaService.orderItems.deleteMany({
      //       where: {
      //         variantId: {
      //           in: variantIds,
      //         },
      //       },
      //     });

      //     await this.prismaService.cancelOrderVariant.deleteMany({
      //       where: {
      //         variantId: {
      //           in: variantIds,
      //         },
      //       },
      //     });

      //     await this.prismaService.returnOrderVariant.deleteMany({
      //       where: {
      //         variantId: {
      //           in: variantIds,
      //         },
      //       },
      //     });
      //   }
      // }

      if (variantIds.length > 0) {
        await this.prismaService.wishlistItem.deleteMany({
          where: {
            variantId: { in: variantIds },
          },
        });

        await this.prismaService.cartItem.deleteMany({
          where: {
            variantId: { in: variantIds },
          },
        });
        await this.prismaService.productVariant.deleteMany({
          where: { id: { in: variantIds } },
        });
      }

      const deletableProductIds = deletableProducts.map((product) => product.id);

      // if (deletableProductIds.length > 0) {
      //   const productQuestions = await this.prismaService.questions.findMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //     select: {
      //       id: true,
      //     },
      //   });

      //   const questionIds = productQuestions.map((item) => item.id);
      //   if (questionIds.length > 0) {
      //     await this.prismaService.answers.deleteMany({
      //       where: {
      //         questionId: {
      //           in: questionIds,
      //         },
      //       },
      //     });
      //   }

      //   await this.prismaService.questions.deleteMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //   });

      //   const productReviews = await this.prismaService.reviews.findMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //     select: {
      //       id: true,
      //     },
      //   });

      //   const reviewIds = productReviews.map((item) => item.id);
      //   if (reviewIds.length > 0) {
      //     await this.prismaService.reply.deleteMany({
      //       where: {
      //         reviewId: {
      //           in: reviewIds,
      //         },
      //       },
      //     });
      //   }

      //   await this.prismaService.reviews.deleteMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //   });

      //   await this.prismaService.notification.deleteMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //   });

      //   await this.prismaService.purchaseOrderDetail.deleteMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //   });

      //   await this.prismaService.purchaseReturnDetail.deleteMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //   });

      //   await this.prismaService.inventory.deleteMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //   });

      //   await this.prismaService.transferDetail.deleteMany({
      //     where: {
      //       productId: {
      //         in: deletableProductIds,
      //       },
      //     },
      //   });
      // }

      // Delete child records to satisfy RESTRICT foreign key constraints before deleting products
      const productQuestions = await this.prismaService.questions.findMany({
        where: { productId: { in: deletableProductIds } },
        select: { id: true },
      });
      const questionIds = productQuestions.map((q) => q.id);
      if (questionIds.length > 0) {
        await this.prismaService.answers.deleteMany({
          where: { questionId: { in: questionIds } },
        });
      }
      await this.prismaService.questions.deleteMany({
        where: { productId: { in: deletableProductIds } },
      });

      const productReviews = await this.prismaService.reviews.findMany({
        where: { productId: { in: deletableProductIds } },
        select: { id: true },
      });
      const reviewIds = productReviews.map((r) => r.id);
      if (reviewIds.length > 0) {
        await this.prismaService.reply.deleteMany({
          where: { reviewId: { in: reviewIds } },
        });
      }
      await this.prismaService.reviews.deleteMany({
        where: { productId: { in: deletableProductIds } },
      });

      await this.prismaService.purchaseOrderDetail.deleteMany({
        where: { productId: { in: deletableProductIds } },
      });

      await this.prismaService.purchaseReturnDetail.deleteMany({
        where: { productId: { in: deletableProductIds } },
      });

      await this.prismaService.transferDetail.deleteMany({
        where: { productId: { in: deletableProductIds } },
      });

      await this.prismaService.productCategory.deleteMany({
        where: { productId: { in: deletableProductIds } },
      });

      await this.prismaService.inventory.deleteMany({
        where: { productId: { in: deletableProductIds } },
      });

      await this.prismaService.product.deleteMany({
        where: { id: { in: deletableProductIds } },
      });

      deletableProducts.forEach((product) => {
        if (product.approved) {
          this.productGateway.emitProductModification(product);
        }
      });

      return {
        message:
          productIdArray.length === 1
            ? "Product has been deleted successfully!"
            : "Selected products have been deleted successfully!",
        deletedProducts: deletableProducts.map((p) => p.title),
      };
    } catch (error) {
      this.logger.error("Error while deleting the product", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getSpecificProduct(productSlug: string) {
    try {
      const specificProduct = await this.prismaService.product.findFirst({
        where: {
          OR: [
            { slug: productSlug },
            { id: productSlug },
          ],
        } as any,
        include: {
          // subCategory: {
          //   include: {
          //     category: true,
          //   },
          // },
          categories: {
            include: {
              category: true
            }
          },
          variants: {
            include: {
              attributes: true,
            },
          },
          vendor: true,
          material: true,
          reviews: true,
          inventoryTypeRelation: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });

      if (!specificProduct) {
        throw new NotFoundException("Product not found!");
      }

      const fallbackInventoryTypeId =
        specificProduct.inventoryTypeId ??
        (await this.getDefaultInventoryTypeId()) ??
        "";

      return {
        data: {
          ...specificProduct,
          inventoryTypeId: fallbackInventoryTypeId,
          inventoryType:
            specificProduct.inventoryTypeRelation?.name ||
            this.DEFAULT_INVENTORY_TYPE_NAME,
        },
      };
    } catch (error) {
      this.logger.error("Error while fetching the product", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  async updateProduct(
    productId: string,
    vendorId: string,
    updatedProductData: Partial<UpdateProductDto>,
  ) {
    try {
      const isProduct = await this.prismaService.product.findUnique({
        where: {
          id: productId,
          vendorId,
        },
        include: {
          variants: true,
        },
      });

      if (!isProduct) {
        throw new NotFoundException("Product not found!");
      }

      const updateData: any = { ...updatedProductData };

      if (
        updatedProductData.descriptiveTitle !== undefined ||
        updatedProductData.title !== undefined
      ) {
        const nextDescriptiveTitle =
          updatedProductData.descriptiveTitle ?? isProduct.descriptiveTitle;
        const nextTitle = updatedProductData.title ?? isProduct.title;

        updateData.slug = await this.generateUniqueSlug(
          nextTitle,
          nextDescriptiveTitle,
          productId,
        );
      }

      if (updatedProductData.inventoryTypeId || updatedProductData.inventoryType) {
        const resolvedInventoryType = await this.resolveInventoryTypeSelection({
          inventoryTypeId: updatedProductData.inventoryTypeId,
          inventoryType: updatedProductData.inventoryType,
        });

        updateData.inventoryTypeId = resolvedInventoryType.inventoryTypeId;
      }

      if (updatedProductData.brand) {
        updateData.brand = updatedProductData.brand;
      }
      if (updatedProductData.material) {
        updateData.material = {
          connect: { id: updatedProductData.material },
        };
      }

      if (updatedProductData?.disapprovalMsg && !updatedProductData?.approved) {
        updateData.approved = false;
        updateData.disapprovalMsg = updatedProductData.disapprovalMsg;
      } else if (updatedProductData?.approved) {
        updateData.approved = true;
        updateData.disapprovalMsg = "";
      }

      const skuData = await this.generateSKU();
      let variantsToUpdate: any[] = [];
      // Track variants removed by the client so we can delete them
      let variantsToDeleteIds: string[] = [];
      if (
        updatedProductData.variants &&
        updatedProductData.variants.length > 0
      ) {
        const existingVariants = isProduct.variants;

        variantsToUpdate = updatedProductData.variants.filter(
          (v) => v.id,
        );
        const variantsToCreate = updatedProductData.variants.filter(
          (v) => !v.id,
        );

        // anything existing but not sent in the payload should be deleted
        const incomingIds = new Set(variantsToUpdate.map((v) => v.id));
        variantsToDeleteIds = existingVariants
          .filter((v) => v.id && !incomingIds.has(v.id))
          .map((v) => v.id);

        updateData.variants = {
          updateMany: variantsToUpdate.map((variant) => {
            const existingVariant = existingVariants.find(
              (v) => v.id === variant.id,
            );
            if (!existingVariant) {
              throw new NotFoundException(
                `Variant with id ${variant.id} not found!`,
              );
            }
            return {
              where: { id: variant.id },
              data: {
                color: variant.color ?? existingVariant.color,
                size: variant.size ?? existingVariant.size,
                images: variant.images ?? existingVariant.images,
                quantity: variant.quantity ?? existingVariant.quantity,
                price: variant.price ?? existingVariant.price,
                discount: variant.discount ?? existingVariant.discount,
                discountedPrice:
                  (variant.price ?? existingVariant.price) -
                  ((variant.price ?? existingVariant.price) *
                    ((variant.discount ?? existingVariant.discount) || 0)) /
                  100,
                sku: variant.sku ?? existingVariant.sku,
                barCode: variant.barCode ?? existingVariant.barCode,
              },
            };
          }),
          create: variantsToCreate.map((variant) => ({
            color: variant.color,
            size: variant.size,
            images: variant.images || [],
            quantity: variant.quantity ?? 0,
            price: variant.price,
            discount: variant.discount ?? 0,
            discountedPrice: variant.discount
              ? variant.price - (variant.price * variant.discount) / 100
              : variant.price,
            sku: skuData,
            barCode: variant.barCode,
            attributes: variant.attributes?.length
              ? {
                create: variant.attributes.map((attr: any) => ({
                  name: attr.name,
                  value: attr.value,
                })),
              }
              : undefined,
          })),
        };
      }

      // Remove variants the client deleted (and their attributes)
      // Skip variants referenced by existing orders — they can't be deleted due to FK RESTRICT
      if (variantsToDeleteIds.length > 0) {
        const referencedVariants = await this.prismaService.orderItems.findMany({
          where: { variantId: { in: variantsToDeleteIds } },
          select: { variantId: true },
          distinct: ['variantId'],
        });
        const referencedIds = new Set(referencedVariants.map((r) => r.variantId));
        const safeToDeleteIds = variantsToDeleteIds.filter((id) => !referencedIds.has(id));

        if (safeToDeleteIds.length > 0) {
          await this.prismaService.variantAttribute.deleteMany({
            where: { variantId: { in: safeToDeleteIds } },
          });
          await this.prismaService.productVariant.deleteMany({
            where: { id: { in: safeToDeleteIds } },
          });
        }
      }

      // Debug: inspect the incoming update payload after prep
      this.logger.log({
        msg: "updateProduct payload",
        productId,
        vendorId,
        variantsToUpdate: variantsToUpdate?.map((v) => ({ id: v.id, color: v.color, size: v.size })),
        variantsToDeleteIds,
        updateData,
      });

      const updatedProduct = await this.prismaService.product.update({
        where: { id: productId },
        data: updateData,
      });

      this.logger.log({
        msg: "updateProduct result",
        productId,
        variantsCount: updatedProductData?.variants?.length || 0,
      });

      // Update attributes for existing variants (updateMany can't handle nested relations)
      if (variantsToUpdate?.length) {
        for (const variant of variantsToUpdate) {
          // Always clear old attributes first, then re-create if provided
          await this.prismaService.variantAttribute.deleteMany({
            where: { variantId: variant.id },
          });
          if (variant.attributes && variant.attributes.length > 0) {
            await this.prismaService.variantAttribute.createMany({
              data: variant.attributes.map((attr: any) => ({
                variantId: variant.id,
                name: attr.name,
                value: attr.value,
              })),
            });
          }
        }
      }

      if (
        updatedProductData.variants?.some(
          (variant) => variant.discount !== 0,
        ) &&
        updatedProductData.endingDate
      ) {
        const targetDate = new Date(updatedProductData.endingDate);
        const now = new Date();
        const jobName = `job-${productId}`;
        const timeDifference = differenceInMilliseconds(targetDate, now);

        if (timeDifference > 0) {
          const job = new CronJob(targetDate, async () => {
            await this.updateVariant(productId, vendorId, {
              endingDate: null,
              discount: 0,
              discountedPrice: 0,
            });
            this.schedulerRegistry.deleteCronJob(jobName);
          });
          this.schedulerRegistry.addCronJob(jobName, job);
          job.start();
        }
      }

      if (updatedProduct.approved) {
        this.productGateway.emitProductModification(updatedProduct);
      }

      return {
        data: updatedProduct,
        message: "Product has been updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error updating product", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateProductCategories(productId: string, categoryId: string[]) {
    try {
      if (!categoryId || !Array.isArray(categoryId) || categoryId.length === 0) {
        throw new BadRequestException("At least one category ID is required.");
      }

      // Validate all IDs exist
      const foundCategories = await this.prismaService.category.findMany({
        where: { id: { in: categoryId } },
        select: { id: true },
      });
      if (foundCategories.length !== categoryId.length) {
        throw new BadRequestException("One or more category IDs are invalid.");
      }

      // Delete existing category links
      await this.prismaService.productCategory.deleteMany({
        where: { productId },
      });

      // Re-create with new set
      await this.prismaService.productCategory.createMany({
        data: categoryId.map((catId) => ({
          productId,
          categoryId: catId,
        })),
        skipDuplicates: true,
      });

      return {
        message: "Product categories updated successfully!",
        data: { productId, categoryId },
      };
    } catch (error) {
      this.logger.error("Error updating product categories", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findRelatedProducts(productIdentifier: string, limit: number = 10) {
    try {

      const product = await this.prismaService.product.findFirst({
        where: {
          OR: [
            { id: productIdentifier },
            { slug: productIdentifier },
          ],
        } as any,
        include: {
          // subCategory: true,
          categories: {
            include: {
              category: true
            }
          },
          variants: true,
          vendor: true,
        },
      });

      if (!product) {
        throw new NotFoundException("Product not found!");
      }

      //
      const categoryIds = product.categories.map(c => c.categoryId);
      //
      const relatedProducts = await this.prismaService.product.findMany({
        // where: {
        //   OR: [{ subCategoryId: product.subCategoryId }],
        //   AND: { id: { not: productId } },
        // },
        where: {
          id: { not: product.id },
          categories: {
            some: {
              // categoryId: { in: categoryId }
              categoryId: { in: categoryIds }

            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        include: {
          categories: {
            include: {
              category: {
                include: {
                  parent: true,
                },
              },
            }
          },
          // subCategory: true,
          variants: true,
          vendor: true,
        },
      });

      return {
        data: relatedProducts,
        message: "Related products fetched successfully!",
      };
    } catch (error) {
      this.logger.error("Error fetching related products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getFeaturedProduct(
    searchTerm: string = "",
    page: number,
    limit: number,
  ) {
    try {
      const skip = (page - 1) * limit;
      searchTerm = searchTerm?.trim();

      const featuredProducts = await this.prismaService.product.findMany({
        where: {
          featured: true,
          approved: true,
          OR: [{ title: { contains: searchTerm, mode: "insensitive" } }],
        },
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          variants: true,
          categories: {
            include: {
              category: {
                include: {
                  parent: true,
                },
              },
            },
          },
        },
      });
      const totalProducts = await this.prismaService.product.count({
        where: {
          featured: true,
          approved: true,
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ],
        },
      });
      return {
        data: featuredProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalFeaturedProducts: totalProducts,
      };
    } catch (error) {
      this.logger.error("Error fetching finding products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getDiscountedProducts(
    searchTerm: string = "",
    page: number,
    limit: number,
  ) {
    try {
      const skip = (page - 1) * limit;
      searchTerm = searchTerm?.trim();

      const discountedProducts = await this.prismaService.product.findMany({
        where: {
          approved: true,
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              variants: {
                some: {
                  discount: { gt: 0 },
                },
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          variants: true,
        },
        skip: skip,
        take: limit,
      });

      const totalProducts = await this.prismaService.product.count({
        where: {
          approved: true,
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              variants: {
                some: {
                  discount: { gt: 0 },
                },
              },
            },
          ],
        },
      });

      return {
        data: discountedProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalDiscountedProducts: totalProducts,
      };
    } catch (error) {
      this.logger.error("Error fetching discounted products", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getSpecificVariant(productId: string, variantId: string) {
    try {
      const variant = await this.prismaService.productVariant.findUnique({
        where: {
          id: variantId,
          productId,
        },
      });

      if (!variant) {
        throw new NotFoundException(`Variant with ID ${variantId} not found`);
      }

      return {
        data: variant,
      };
    } catch (error) {
      this.logger.error("Error fetching specific variant", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateVariant(
    productId: string,
    variantId: string,
    updateVariantData: UpdateVariantDto,
  ) {
    try {
      const variant = await this.prismaService.productVariant.findUnique({
        where: {
          id: variantId,
          productId,
        },
        include: {
          product: true,
        },
      });

      if (!variant) {
        throw new NotFoundException(`Variant with ID ${variantId} not found`);
      }

      const previousQuantity = variant.quantity ?? 0;
      const updatedQuantity = updateVariantData.quantity ?? previousQuantity;

      const { attributes, ...restUpdateData } = updateVariantData as any;

      const updatedVariant = await this.prismaService.productVariant.update({
        where: {
          id: variantId,
        },
        data: restUpdateData,
      });

      if (attributes && attributes.length > 0) {
        await this.prismaService.variantAttribute.deleteMany({
          where: { variantId },
        });
        await this.prismaService.variantAttribute.createMany({
          data: attributes.map((attr: any) => ({
            variantId,
            name: attr.name,
            value: attr.value,
          })),
        });
      }
      if (variant.product.approved) {
        this.productGateway.emitProductModification(variant);
      }

      let message = "Variant has been updated successfully!";

      if (updateVariantData.quantity !== undefined) {
        if (updatedQuantity > previousQuantity) {
          message = "Stock has been increased successfully.";
        } else if (updatedQuantity < previousQuantity) {
          message = "Stock has been reduce successfully.";
        }
      }

      return {
        data: updatedVariant,
        message: message,
      };
    } catch (error) {
      this.logger.error("Error updating variant", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteVariant(productId: string, variantId: string) {
    try {
      const variant = await this.prismaService.productVariant.findUnique({
        where: {
          id: variantId,
          productId,
        },
        include: {
          product: true,
        },
      });

      if (!variant) {
        throw new NotFoundException(`Variant with ID ${variantId} not found`);
      }

      await this.prismaService.productVariant.delete({
        where: {
          id: variantId,
          productId,
        },
      });

      if (variant.product.approved) {
        this.productGateway.emitProductModification(variant);
      }

      return {
        message: "Variant has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error delete specific variant", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getBestSellingProducts(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const bestSellingProducts = await this.prismaService.product.findMany({
        where: {
          vendorId,
        },
        orderBy: {
          totalSold: "desc",
        },
        skip: skip,
        take: limit,
        include: {
          variants: true,
        },
      });

      const totalProducts = await this.prismaService.product.count({
        where: {
          vendorId,
        },
      });

      return {
        data: bestSellingProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts: totalProducts,
      };
    } catch (error) {
      console.error("Error fetching best-selling products", error);
      throw new Error("Could not fetch best-selling products");
    }
  }

  async getBestSellingProductsForWebsite(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const bestSellingProducts = await this.prismaService.product.findMany({
        orderBy: {
          totalSold: "desc",
        },
        skip: skip,
        take: limit,
        include: {
          variants: true,
          categories: {
            include: {
              category: {
                include: {
                  parent: true,
                },
              },
            },
          },
        },
      });

      const totalProducts = await this.prismaService.product.count();

      return {
        data: bestSellingProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts: totalProducts,
      };
    } catch (error) {
      console.error("Error fetching best-selling products", error);
      throw new Error("Could not fetch best-selling products");
    }
  }

  async getMayYouLikeProducts(userId: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          wishlist: {
            include: {
              items: {
                include: {
                  variant: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
            },
          },
          orders: {
            include: {
              products: {
                include: {
                  variant: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!user) {
        return this.getBestSellingProductsForWebsite(1, 10);
      }
      const wishlistProductIds = user?.wishlist?.items.flatMap(
        (item) => item.variant.productId || [],
      );
      const orderedProductIds = user?.orders?.flatMap((order) =>
        order.products.flatMap((product) => product.variant.productId),
      );

      const interestedProductIds = [
        ...new Set([...wishlistProductIds, ...orderedProductIds]),
      ];

      const interestedProducts = await this.prismaService.product.findMany({
        where: { id: { in: interestedProductIds } },
        // select: { subCategoryId: true },
        select: {
          categories: {
            select: { categoryId: true }
          }
        }

      });

      // const subCategoryIds = [
      //   ...new Set(
      //     interestedProducts.map((p) => p.subCategoryId).filter(Boolean),
      //   ),
      // ];
      const categoryIds = [
        ...new Set(
          interestedProducts.flatMap(p =>
            p.categories.map(c => c.categoryId)
          )
        )
      ];

      const recommendedProducts = await this.prismaService.product.findMany({
        where: {
          // OR: [{ subCategoryId: { in: subCategoryIds } }],
          categories: {
            some: {
              categoryId: { in: categoryIds }
            }
          },

          id: { notIn: interestedProductIds },
        },
        orderBy: { totalSold: "desc" },
        take: 10,
        include: {
          variants: true,
          // subCategory: true
          categories: {
            include: {
              category: {
                include: {
                  parent: true,
                },
              },
            }
          }
        },
      });

      if (recommendedProducts.length === 0) {
        return this.getBestSellingProductsForWebsite(1, 10);
      }

      return {
        message: "Get may you like products",
        recommendedProducts,
      };
    } catch (error) {
      console.error("Error fetching May you like products", error);
      throw new Error("Could not fetch May you like products");
    }
  }
}
