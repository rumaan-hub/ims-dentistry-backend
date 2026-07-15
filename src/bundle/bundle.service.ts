import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BundleStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { exceptionHandler, handlePrismaError } from 'src/utils/error-handler.util';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { FilterBundleDto } from './dto/filter-bundle.dto';

@Injectable()
export class BundleService {
  private readonly logger = new Logger(BundleService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const suffix = Math.random().toString(36).substring(2, 7);
    return `${base}-${suffix}`;
  }

  private bundleInclude = {
    items: {
      include: {
        product: {
          select: { id: true, title: true, images: true, slug: true },
        },
        variant: {
          select: { id: true, price: true, color: true, size: true, images: true, quantity: true },
        },
      },
    },
    vendor: {
      select: { id: true, firstName: true, lastName: true },
    },
  };

  private async calculateOriginalPrice(
    items: { productId: string; variantId?: string; quantity: number }[],
  ): Promise<number> {
    let total = 0;
    for (const item of items) {
      if (item.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { price: true, productId: true },
        });
        if (!variant) throw new NotFoundException(`Variant ${item.variantId} not found.`);
        if (variant.productId !== item.productId)
          throw new BadRequestException(`Variant does not belong to product ${item.productId}.`);
        total += variant.price * item.quantity;
      } else {
        const variant = await this.prisma.productVariant.findFirst({
          where: { productId: item.productId },
          select: { price: true },
          orderBy: { price: 'asc' },
        });
        if (!variant) throw new NotFoundException(`No variant found for product ${item.productId}.`);
        total += variant.price * item.quantity;
      }
    }
    return parseFloat(total.toFixed(2));
  }

  private async validateVendorProducts(
    items: { productId: string; variantId?: string; quantity: number }[],
    vendorId: string,
  ): Promise<void> {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const count = await this.prisma.product.count({
      where: { id: { in: productIds }, vendorId, isActive: true },
    });
    if (count !== productIds.length) {
      throw new BadRequestException('Some products do not belong to this vendor or are inactive.');
    }
  }

  private async notifyAdmin(title: string, message: string): Promise<void> {
    const admins = await this.prisma.admin.findMany({ select: { id: true } });
    await Promise.all(
      admins.map((admin) =>
        this.prisma.notification.create({
          data: { title, message, adminId: admin.id },
        }),
      ),
    );
  }

  private async notifyVendor(vendorId: string, title: string, message: string): Promise<void> {
    await this.prisma.notification.create({
      data: { title, message, vendorId },
    });
  }

  // ─── Vendor Endpoints ──────────────────────────────────────────────────────

  async createBundle(dto: CreateBundleDto, vendorId: string) {
    try {
      const vendor = await this.prisma.vendors.findUnique({ where: { id: vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found.');

      await this.validateVendorProducts(dto.items, vendorId);

      const isNoItemsBundle = dto.appliedTo === 'AllProducts' || dto.appliedTo === 'SpecificCategories';
      let originalPrice = 0;
      let bundlePrice = 0;
      let discountPercentage = 0;

      if (isNoItemsBundle) {
        // No items — discount applied per-item at checkout when qty >= minQuantity
        if (dto.discountValue == null) {
          throw new BadRequestException('Provide discountType + discountValue for this bundle type.');
        }
        discountPercentage = dto.discountType === 'Percentage' ? dto.discountValue : 0;
      } else {
        originalPrice = await this.calculateOriginalPrice(dto.items);
        if (dto.bundlePrice != null) {
          bundlePrice = dto.bundlePrice;
        } else if (dto.discountValue != null && originalPrice > 0) {
          if (dto.discountType === 'Percentage') {
            bundlePrice = parseFloat((originalPrice * (1 - dto.discountValue / 100)).toFixed(2));
          } else {
            bundlePrice = parseFloat((originalPrice - dto.discountValue).toFixed(2));
          }
          if (bundlePrice < 0.01) bundlePrice = 0.01;
        } else {
          throw new BadRequestException('Provide either bundlePrice or discountType + discountValue.');
        }
        if (originalPrice > 0 && bundlePrice >= originalPrice) {
          throw new BadRequestException('Bundle price must be less than original price.');
        }
        discountPercentage = originalPrice > 0
          ? parseFloat((((originalPrice - bundlePrice) / originalPrice) * 100).toFixed(2))
          : 0;
      }

      const slug = dto.slug
        ? dto.slug.toLowerCase().replace(/\s+/g, '-')
        : this.generateSlug(dto.title);

      const bundle = await this.prisma.bundleProduct.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description ?? null,
          images: dto.images ?? [],
          bundlePrice,
          originalPrice,
          discountPercentage,
          label: dto.label ?? (isNoItemsBundle
            ? (dto.discountType === 'Percentage'
                ? `${dto.discountValue}% OFF`
                : `$${dto.discountValue} OFF`)
            : `Save ${Math.round(discountPercentage)}%`),
          status: BundleStatus.DRAFT,
          isActive: false,
          vendorId,
          discountType: dto.discountType ?? null,
          discountValue: dto.discountValue ?? null,
          appliedTo: dto.appliedTo ?? null,
          productIds: dto.productIds ?? [],
          categoryIds: dto.categoryIds ?? [],
          minQuantity: dto.minQuantity ?? null,
          maxPurchasesPerUser: dto.maxPurchasesPerUser ?? null,
          durationType: dto.durationType ?? null,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          deliveryCharges: dto.deliveryCharges ?? 0,
          items: {
            create: await Promise.all(
              dto.items.map(async (item) => {
                let price: number;
                if (item.variantId) {
                  const v = await this.prisma.productVariant.findUnique({
                    where: { id: item.variantId },
                    select: { price: true },
                  });
                  price = v.price;
                } else {
                  const v = await this.prisma.productVariant.findFirst({
                    where: { productId: item.productId },
                    select: { price: true },
                    orderBy: { price: 'asc' },
                  });
                  price = v.price;
                }
                return {
                  productId: item.productId,
                  variantId: item.variantId ?? null,
                  quantity: item.quantity,
                  priceAtCreation: price,
                };
              }),
            ),
          },
        },
        include: this.bundleInclude,
      });

      return { bundle, message: 'Bundle created as draft.' };
    } catch (error) {
      this.logger.error('createBundle error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async updateBundle(dto: UpdateBundleDto, bundleId: string, vendorId: string) {
    try {
      const existing = await this.prisma.bundleProduct.findUnique({
        where: { id: bundleId },
        include: { items: true },
      });
      if (!existing) throw new NotFoundException('Bundle not found.');
      if (existing.vendorId !== vendorId) throw new ForbiddenException('You do not own this bundle.');

      const resolvedAppliedTo = dto.appliedTo ?? (existing as any).appliedTo;
      const isNoItemsBundle = resolvedAppliedTo === 'AllProducts' || resolvedAppliedTo === 'SpecificCategories';

      const items = dto.items ?? existing.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));

      if (dto.items && !isNoItemsBundle) {
        await this.validateVendorProducts(dto.items, vendorId);
      }

      let originalPrice = 0;
      let bundlePrice = 0;
      let discountPercentage = 0;

      if (isNoItemsBundle) {
        const effectiveDiscount = dto.discountValue ?? (existing as any).discountValue;
        const effectiveType = dto.discountType ?? (existing as any).discountType ?? 'Percentage';
        discountPercentage = effectiveType === 'Percentage' ? (effectiveDiscount ?? 0) : 0;
      } else {
        originalPrice = await this.calculateOriginalPrice(items);
        if (dto.bundlePrice != null) {
          bundlePrice = dto.bundlePrice;
        } else if (dto.discountValue != null && originalPrice > 0) {
          const dtype = dto.discountType ?? (existing as any).discountType ?? 'FixPrice';
          if (dtype === 'Percentage') {
            bundlePrice = parseFloat((originalPrice * (1 - dto.discountValue / 100)).toFixed(2));
          } else {
            bundlePrice = parseFloat((originalPrice - dto.discountValue).toFixed(2));
          }
          if (bundlePrice < 0.01) bundlePrice = 0.01;
        } else {
          bundlePrice = existing.bundlePrice;
        }
        if (originalPrice > 0 && bundlePrice >= originalPrice) {
          throw new BadRequestException('Bundle price must be less than original price.');
        }
        discountPercentage = originalPrice > 0
          ? parseFloat((((originalPrice - bundlePrice) / originalPrice) * 100).toFixed(2))
          : 0;
      }

      const effectiveDiscountValue = dto.discountValue ?? (existing as any).discountValue;
      const effectiveDiscountType = dto.discountType ?? (existing as any).discountType ?? 'Percentage';
      const updateData: any = {
        originalPrice,
        discountPercentage,
        bundlePrice,
        label: dto.label ?? (isNoItemsBundle
          ? (effectiveDiscountType === 'Percentage'
              ? `${effectiveDiscountValue}% OFF`
              : `$${effectiveDiscountValue} OFF`)
          : `Save ${Math.round(discountPercentage)}%`),
        // Keep current status — only reset REJECTED to DRAFT so vendor can re-submit
        status: existing.status === BundleStatus.REJECTED ? BundleStatus.DRAFT : existing.status,
        disapprovalMsg: existing.status === BundleStatus.REJECTED ? null : existing.disapprovalMsg,
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.appliedTo !== undefined && { appliedTo: dto.appliedTo }),
        ...(dto.productIds !== undefined && { productIds: dto.productIds }),
        ...(dto.categoryIds !== undefined && { categoryIds: dto.categoryIds }),
        ...(dto.minQuantity !== undefined && { minQuantity: dto.minQuantity }),
        ...(dto.maxPurchasesPerUser !== undefined && { maxPurchasesPerUser: dto.maxPurchasesPerUser ?? null }),
        ...(dto.deliveryCharges !== undefined && { deliveryCharges: dto.deliveryCharges }),
        ...(dto.durationType !== undefined && { durationType: dto.durationType }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
      };

      if (dto.title) updateData.title = dto.title;
      if (dto.slug) updateData.slug = dto.slug.toLowerCase().replace(/\s+/g, '-');
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.images) updateData.images = dto.images;

      if (dto.items) {
        await this.prisma.bundleItem.deleteMany({ where: { bundleId } });
        updateData.items = {
          create: await Promise.all(
            dto.items.map(async (item) => {
              let price: number;
              if (item.variantId) {
                const v = await this.prisma.productVariant.findUnique({
                  where: { id: item.variantId },
                  select: { price: true },
                });
                price = v.price;
              } else {
                const v = await this.prisma.productVariant.findFirst({
                  where: { productId: item.productId },
                  select: { price: true },
                  orderBy: { price: 'asc' },
                });
                price = v.price;
              }
              return {
                productId: item.productId,
                variantId: item.variantId ?? null,
                quantity: item.quantity,
                priceAtCreation: price,
              };
            }),
          ),
        };
      }

      const bundle = await this.prisma.bundleProduct.update({
        where: { id: bundleId },
        data: updateData,
        include: this.bundleInclude,
      });

      return { bundle, message: 'Bundle updated successfully.' };
    } catch (error) {
      this.logger.error('updateBundle error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async deleteBundle(bundleId: string, vendorId: string) {
    try {
      const existing = await this.prisma.bundleProduct.findUnique({ where: { id: bundleId } });
      if (!existing) throw new NotFoundException('Bundle not found.');
      if (existing.vendorId !== vendorId) throw new ForbiddenException('You do not own this bundle.');

      await this.prisma.bundleProduct.delete({ where: { id: bundleId } });
      return { message: 'Bundle deleted successfully.' };
    } catch (error) {
      this.logger.error('deleteBundle error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async submitBundle(bundleId: string, vendorId: string) {
    try {
      const existing = await this.prisma.bundleProduct.findUnique({ where: { id: bundleId } });
      if (!existing) throw new NotFoundException('Bundle not found.');
      if (existing.vendorId !== vendorId) throw new ForbiddenException('You do not own this bundle.');
      if (!([BundleStatus.DRAFT, BundleStatus.REJECTED] as BundleStatus[]).includes(existing.status)) {
        throw new BadRequestException('Only DRAFT or REJECTED bundles can be submitted.');
      }

      const bundle = await this.prisma.bundleProduct.update({
        where: { id: bundleId },
        data: { status: BundleStatus.PENDING },
      });

      await this.notifyAdmin(
        'New Bundle Approval Request',
        `Vendor ${existing.vendorId} submitted bundle "${existing.title}" for review.`,
      );

      return { bundle, message: 'Bundle submitted for approval.' };
    } catch (error) {
      this.logger.error('submitBundle error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async togglePause(bundleId: string, vendorId: string) {
    try {
      const existing = await this.prisma.bundleProduct.findUnique({ where: { id: bundleId } });
      if (!existing) throw new NotFoundException('Bundle not found.');
      if (existing.vendorId !== vendorId) throw new ForbiddenException('You do not own this bundle.');
      if (!([BundleStatus.APPROVED, BundleStatus.PAUSED] as BundleStatus[]).includes(existing.status)) {
        throw new BadRequestException('Only APPROVED or PAUSED bundles can be toggled.');
      }

      const isPausing = existing.status === BundleStatus.APPROVED;
      const bundle = await this.prisma.bundleProduct.update({
        where: { id: bundleId },
        data: {
          status: isPausing ? BundleStatus.PAUSED : BundleStatus.APPROVED,
          isActive: !isPausing,
        },
      });

      return { bundle, message: isPausing ? 'Bundle paused.' : 'Bundle resumed.' };
    } catch (error) {
      this.logger.error('togglePause error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async getVendorBundles(vendorId: string, filter: FilterBundleDto) {
    try {
      const { page = 1, limit = 10, search, status } = filter;
      const skip = (page - 1) * limit;

      const where: any = { vendorId };
      if (status) where.status = status;
      if (search) where.title = { contains: search, mode: 'insensitive' };

      const [bundles, total] = await this.prisma.$transaction([
        this.prisma.bundleProduct.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.bundleInclude,
        }),
        this.prisma.bundleProduct.count({ where }),
      ]);

      return {
        data: bundles,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalBundles: total,
      };
    } catch (error) {
      this.logger.error('getVendorBundles error', error);
      throw handlePrismaError(error);
    }
  }

  async getBundleById(bundleId: string) {
    try {
      const bundle = await this.prisma.bundleProduct.findUnique({
        where: { id: bundleId },
        include: this.bundleInclude,
      });
      if (!bundle) throw new NotFoundException('Bundle not found.');
      return { data: bundle };
    } catch (error) {
      this.logger.error('getBundleById error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  // ─── Admin Endpoints ───────────────────────────────────────────────────────

  async getAllBundlesAdmin(filter: FilterBundleDto) {
    try {
      const { page = 1, limit = 10, search, status } = filter;
      const skip = (page - 1) * limit;

      // DRAFT bundles are vendor-only; admin sees PENDING, APPROVED, REJECTED, PAUSED
      const where: any = { status: { not: BundleStatus.DRAFT } };
      if (status) where.status = status;
      if (search) where.title = { contains: search, mode: 'insensitive' };

      const [bundles, total] = await this.prisma.$transaction([
        this.prisma.bundleProduct.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            ...this.bundleInclude,
            approvedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        this.prisma.bundleProduct.count({ where }),
      ]);

      return {
        data: bundles,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalBundles: total,
      };
    } catch (error) {
      this.logger.error('getAllBundlesAdmin error', error);
      throw handlePrismaError(error);
    }
  }

  async approveBundle(bundleId: string, adminId: string) {
    try {
      const existing = await this.prisma.bundleProduct.findUnique({ where: { id: bundleId } });
      if (!existing) throw new NotFoundException('Bundle not found.');
      if (existing.status !== BundleStatus.PENDING) {
        throw new BadRequestException('Only PENDING bundles can be approved.');
      }

      const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });

      const bundle = await this.prisma.bundleProduct.update({
        where: { id: bundleId },
        data: {
          status: BundleStatus.APPROVED,
          isActive: true,
          approvedById: admin ? adminId : null,
          approvedAt: new Date(),
          disapprovalMsg: null,
        },
      });

      await this.notifyVendor(
        existing.vendorId,
        'Bundle Approved',
        `Your bundle "${existing.title}" has been approved and is now live.`,
      );

      return { bundle, message: 'Bundle approved successfully.' };
    } catch (error) {
      this.logger.error('approveBundle error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async rejectBundle(bundleId: string, adminId: string, reason: string) {
    try {
      if (!reason?.trim()) {
        throw new BadRequestException('Rejection reason is required.');
      }

      const existing = await this.prisma.bundleProduct.findUnique({ where: { id: bundleId } });
      if (!existing) throw new NotFoundException('Bundle not found.');
      if (existing.status !== BundleStatus.PENDING) {
        throw new BadRequestException('Only PENDING bundles can be rejected.');
      }

      const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });

      const bundle = await this.prisma.bundleProduct.update({
        where: { id: bundleId },
        data: {
          status: BundleStatus.REJECTED,
          isActive: false,
          approvedById: admin ? adminId : null,
          disapprovalMsg: reason,
        },
      });

      await this.notifyVendor(
        existing.vendorId,
        'Bundle Rejected',
        `Your bundle "${existing.title}" was rejected. Reason: ${reason}`,
      );

      return { bundle, message: 'Bundle rejected.' };
    } catch (error) {
      this.logger.error('rejectBundle error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  // ─── Public Endpoints ──────────────────────────────────────────────────────

  async getStorewideDeals() {
    try {
      const deals = await this.prisma.bundleProduct.findMany({
        where: {
          status: BundleStatus.APPROVED,
          isActive: true,
          appliedTo: { in: ['AllProducts', 'SpecificCategories'] },
        },
        select: {
          id: true,
          vendorId: true,
          title: true,
          label: true,
          appliedTo: true,
          discountType: true,
          discountValue: true,
          discountPercentage: true,
          minQuantity: true,
          categoryIds: true,
        },
      });

      // Recursively expand categoryIds to include ALL descendants at every depth level,
      // so products in sub-sub-categories (and deeper) are also matched correctly.
      const seedIds = [...new Set(
        deals
          .filter((d) => d.appliedTo === 'SpecificCategories' && d.categoryIds.length > 0)
          .flatMap((d) => d.categoryIds),
      )];

      // BFS level-by-level: build parentId -> [childIds] map for the full subtree
      const parentToChildren = new Map<string, string[]>();
      if (seedIds.length > 0) {
        let frontier = [...seedIds];
        const visited = new Set<string>(seedIds);

        while (frontier.length > 0) {
          const children = await this.prisma.category.findMany({
            where: { parentId: { in: frontier } },
            select: { id: true, parentId: true },
          });
          const nextFrontier: string[] = [];
          for (const child of children) {
            const siblings = parentToChildren.get(child.parentId!) ?? [];
            if (!siblings.includes(child.id)) siblings.push(child.id);
            parentToChildren.set(child.parentId!, siblings);
            if (!visited.has(child.id)) {
              visited.add(child.id);
              nextFrontier.push(child.id);
            }
          }
          frontier = nextFrontier;
        }
      }

      // Walk the map to collect every descendant of a given category ID
      const collectDescendants = (id: string): string[] => {
        const result: string[] = [];
        const queue = [id];
        while (queue.length > 0) {
          const cur = queue.shift()!;
          const kids = parentToChildren.get(cur) ?? [];
          result.push(...kids);
          queue.push(...kids);
        }
        return result;
      };

      const expanded = deals.map((deal) => {
        if (deal.appliedTo !== 'SpecificCategories' || deal.categoryIds.length === 0) {
          return deal;
        }
        const extra = new Set<string>();
        for (const id of deal.categoryIds) {
          collectDescendants(id).forEach((d) => extra.add(d));
        }
        return { ...deal, categoryIds: [...deal.categoryIds, ...Array.from(extra)] };
      });

      return { data: expanded };
    } catch (error) {
      this.logger.error('getStorewideDeals error', error);
      throw handlePrismaError(error);
    }
  }

  async getApprovedBundles(filter: FilterBundleDto) {
    try {
      const { page = 1, limit = 10, search } = filter;
      const skip = (page - 1) * limit;

      // Exclude AllProducts/SpecificCategories deals — they show as labels on product cards, not as bundle cards.
      // Include SpecificProducts bundles AND legacy bundles where appliedTo is null (created before the field existed).
      const where: any = {
        status: BundleStatus.APPROVED,
        isActive: true,
        OR: [
          { appliedTo: 'SpecificProducts' },
          { appliedTo: null },
        ],
      };
      if (search) where.title = { contains: search, mode: 'insensitive' };

      const [bundles, total] = await this.prisma.$transaction([
        this.prisma.bundleProduct.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.bundleInclude,
        }),
        this.prisma.bundleProduct.count({ where }),
      ]);

      return {
        data: bundles,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalBundles: total,
      };
    } catch (error) {
      this.logger.error('getApprovedBundles error', error);
      throw handlePrismaError(error);
    }
  }

  async getBundleBySlug(slug: string) {
    try {
      const bundle = await this.prisma.bundleProduct.findUnique({
        where: { slug },
        include: this.bundleInclude,
      });
      if (!bundle || !bundle.isActive) throw new NotFoundException('Bundle not found.');
      return { data: bundle };
    } catch (error) {
      this.logger.error('getBundleBySlug error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  // ─── Stock Auto-Pause (called from product update flow) ────────────────────

  async pauseBundlesForProduct(productId: string): Promise<void> {
    try {
      const affectedBundles = await this.prisma.bundleProduct.findMany({
        where: {
          status: BundleStatus.APPROVED,
          items: { some: { productId } },
        },
        select: { id: true, title: true, vendorId: true },
      });

      if (!affectedBundles.length) return;

      await this.prisma.bundleProduct.updateMany({
        where: { id: { in: affectedBundles.map((b) => b.id) } },
        data: { status: BundleStatus.PAUSED, isActive: false },
      });

      await Promise.all(
        affectedBundles.map((b) =>
          this.notifyVendor(
            b.vendorId,
            'Bundle Auto-Paused',
            `Bundle "${b.title}" was paused because a product in it went out of stock.`,
          ),
        ),
      );
    } catch (error) {
      this.logger.error('pauseBundlesForProduct error', error);
    }
  }
}
