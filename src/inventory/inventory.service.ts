import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

import { SystemActivityService } from '../system-activity/system-activity.service';

@Injectable()
export class InventoryService {
  private readonly DEFAULT_INVENTORY_TYPE_NAME = 'CONSUMABLE';

  constructor(
    private prisma: PrismaService,
    private activityService: SystemActivityService,
  ) { }

  /** Returns office.client_id filter or empty object for system admins */
  private clientFilter(user: any): { office?: { client_id: string } } {
    if (user?.is_system_admin) return {};
    return { office: { client_id: user.client_id } };
  }

  private normalizeInventoryTypeName(value?: string): string | null {
    if (!value?.trim()) {
      return null;
    }

    return value.trim().toUpperCase();
  }

  private buildProductInventoryTypeFilter(inventoryType?: string) {
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

  /** Stable ledger-row key, independent of whether the item is catalog or custom. */
  private itemKeyOf(row: { productId?: string | null; customProductId?: string | null }): string {
    return row.productId ?? `custom:${row.customProductId}`;
  }

  // ================= CREATE =================
  async create(createInventoryDto: CreateInventoryDto, user?: any) {
    // Each ledger row points to EXACTLY ONE item source: a catalog product OR a custom one.
    const hasCatalog = !!createInventoryDto.productId;
    const hasCustom = !!createInventoryDto.customProductId;
    if (!hasCatalog && !hasCustom) {
      throw new BadRequestException('Either productId or customProductId is required');
    }
    if (hasCatalog && hasCustom) {
      throw new BadRequestException('Cannot have both productId and customProductId');
    }
    if (hasCustom && createInventoryDto.transaction_type === 'TRANSFER') {
      throw new BadRequestException('Custom products cannot be transferred.');
    }

    // Identifies this item in the ledger regardless of its source.
    const itemWhere: { productId?: string; customProductId?: string } = hasCustom
      ? { customProductId: createInventoryDto.customProductId }
      : { productId: createInventoryDto.productId };

    if (['OUT', 'TRANSFER', 'ADJUSTMENT'].includes(createInventoryDto.transaction_type)) {
      // Calculate net stock at the specific SOURCE office
      const records = await this.prisma.inventory.findMany({
        where: {
          ...itemWhere,
          office_id: createInventoryDto.office_id
        }
      });

      let netStock = 0;
      records.forEach(r => {
        if (r.transaction_type === 'IN') netStock += r.quantity;
        else netStock -= r.quantity;
      });

      if (netStock < createInventoryDto.quantity) {
        throw new BadRequestException(`Insufficient stock in this office. Available stock is ${netStock}.`);
      }
    }

    const { productName, productType, supplier, size, category, brand, destination_office_id, ...inventoryData } = createInventoryDto;

    // Catalog-attribute edits apply only to marketplace products. Custom-product
    // attributes live in the custom product's JSON and are edited via /ims/custom-products.
    if (hasCatalog && (productName || productType || size || brand)) {
      // Best-effort catalog sync — updateMany won't throw P2025 if the product is missing
      // (e.g. a stale id), so it never crashes the inventory transaction.
      await this.prisma.product.updateMany({
        where: { id: createInventoryDto.productId },
        data: {
          ...(productName && { title: productName }),
          ...(productType && { type: productType }),
          ...(size && { packaging: size }),
          ...(brand && { brand: brand }),
        }
      });
    }

    if (createInventoryDto.transaction_type === 'TRANSFER') {
      if (!destination_office_id) {
        throw new BadRequestException("Destination office must be provided for a transfer.");
      }

      const sourceOffice = await this.prisma.office.findUnique({ where: { office_id: createInventoryDto.office_id } });
      const destOffice = await this.prisma.office.findUnique({ where: { office_id: destination_office_id } });

      const transferRef = `TRN-${Date.now()}`;

      const [outRecord] = await this.prisma.$transaction([
        this.prisma.inventory.create({
          data: {
            ...inventoryData,
            transaction_type: 'TRANSFER',
            purpose: `To: ${destOffice?.office_name || 'Destination'} | Ref: ${transferRef}`,
            ...(brand && { brand: brand }),
            expiry_date: inventoryData.expiry_date ? new Date(inventoryData.expiry_date) : null,
          },
          include: { product: true, staff: true, office: true },
        }),
        this.prisma.inventory.create({
          data: {
            ...inventoryData,
            office_id: destination_office_id,
            transaction_type: 'IN',
            purpose: `From: ${sourceOffice?.office_name || 'Source'} | Ref: ${transferRef}`,
            ...(brand && { brand: brand }),
            expiry_date: inventoryData.expiry_date ? new Date(inventoryData.expiry_date) : null,
          },
          include: { product: true, staff: true, office: true },
        }),
      ]);

      this.activityService.create({
        action: 'Manual Stock Transfer',
        product: outRecord.product?.title,
        office: `${sourceOffice?.office_name} -> ${destOffice?.office_name}`,
        user: outRecord.staff?.first_name ? `${outRecord.staff.first_name} ${outRecord.staff.last_name || ''}` : undefined,
        client_id: outRecord.office?.client_id,
      });

      return outRecord;
    }

    const res = await this.prisma.inventory.create({
      data: {
        ...inventoryData,
        ...(brand && { brand: brand }),
        expiry_date: inventoryData.expiry_date
          ? new Date(inventoryData.expiry_date)
          : null,
      },
      include: {
        product: true,
        customProduct: true,
        staff: true,
        office: true,
      },
    });

    this.activityService.create({
      action: res.transaction_type === 'IN' ? 'Stock Scanned In' : 'Inventory record created',
      product: res.product?.title ?? res.customProduct?.name,
      office: res.office?.office_name,
      user: res.staff?.first_name ? `${res.staff.first_name} ${res.staff.last_name || ''}` : undefined,
      client_id: res.office?.client_id,
    });

    return res;
  }

  // ================= FIND ALL =================
  async findAll(user: any, searchTerm: string = "", page: number = 1, limit: number = 50, officeId?: string, inventoryType?: string) {
    try {
      const skip = (page - 1) * limit;
      const filters: any = {};

      if (searchTerm?.trim()) {
        filters.OR = [
          {
            title: {
              contains: searchTerm.trim(),
              mode: 'insensitive',
            },
          },
          {
            brand: {
              contains: searchTerm.trim(),
              mode: 'insensitive',
            },
          },
        ];
      }

      // Client-scoped inventory filter
      const cf = this.clientFilter(user);
      const inventoryWhere: any = { ...cf };
      if (officeId) inventoryWhere.office_id = officeId;

      // Only fetch products that have at least one inventory record for this client
      filters.inventoryItems = { some: inventoryWhere };

      const inventoryTypeFilter = this.buildProductInventoryTypeFilter(inventoryType);
      if (inventoryTypeFilter) {
        filters.AND = [...(filters.AND || []), inventoryTypeFilter];
      }

      // 1. Fetch products with pagination
      const products = await this.prisma.product.findMany({
        where: filters,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { include: { category: true } },
          vendor: true,
          inventoryItems: {
            where: inventoryWhere,
            include: {
              staff: true,
              office: true,
            },
          },
        },
      });

      const totalProductsCount = await this.prisma.product.count({ where: filters });

      const result = [];

      for (const product of products) {
        try {
          const categoryName = product.categories?.[0]?.category?.name ?? 'Uncategorized';
          const vendorName = product.vendor ? `${product.vendor.firstName} ${product.vendor.lastName}` : 'Unknown';

          if (!product.inventoryItems || product.inventoryItems.length === 0) {
            // Placeholder for brand new products
            result.push({
              id: `virtual-${product.id}`,
              name: product.title,
              category: categoryName,
              type: product.type ?? 'Consumable',
              brand: product.brand ?? 'N/A',
              batch: 'N/A',
              expiry: '',
              supplier: vendorName,
              available: 0,
              used: 0,
              damaged: 0,
              repair: 0,
              price: 0,
              staffIn: 'N/A',
              room: '',
              productId: product.id,
              office_id: '',
              staff_id: '',
              transaction_type: 'IN',
              unit_price: 0,
              _product: product,
              office: null,
              staff: null,
              status: 'ACTIVE',
              source: 'catalog',
            });
          } else {
            // Map each actual inventory record
            for (const item of product.inventoryItems) {
              const expiry = item.expiry_date instanceof Date
                ? item.expiry_date.toISOString().split('T')[0]
                : '';

              result.push({
                ...item,
                id: item.id,
                name: product.title,
                category: categoryName,
                type: product.type ?? 'Consumable',
                brand: item.brand ?? product.brand ?? 'N/A',
                batch: item.batch_no ?? 'N/A',
                expiry,
                supplier: vendorName,
                available: item.quantity ?? 0,
                used: 0,
                damaged: 0,
                repair: 0,
                price: item.unit_price ?? 0,
                staffIn: item.staff ? `${item.staff.first_name} ${item.staff.last_name}` : 'N/A',
                room: item.room_number ?? '',
                productId: item.productId,
                office_id: item.office_id,
                staff_id: item.staff_id,
                transaction_type: item.transaction_type,
                unit_price: item.unit_price ?? 0,
                _product: product,
                office: item.office ?? null,
                staff: item.staff ?? null,
                status: item.status ?? 'ACTIVE',
                source: 'catalog',
              });
            }
          }
        } catch (innerError) {
          console.error(`Error mapping product ${product.id}:`, innerError);
        }
      }

      // ── Custom (non-catalog) products: inventory-centric query, merged in ──
      // findAll above is product-centric (prisma.product) so it can only return
      // catalog-backed rows. Custom items are surfaced on page 1 and counted toward totals.
      // Only ACTIVE custom products (is_active=true) — soft-deleted ones must not render.
      const customWhere: any = {
        ...cf,
        customProductId: { not: null },
        status: { not: 'INACTIVE' },
        customProduct: { is: { is_active: true } },
      };
      if (officeId) customWhere.office_id = officeId;
      if (searchTerm?.trim()) {
        customWhere.customProduct.is.name = { contains: searchTerm.trim(), mode: 'insensitive' };
      }

      const customRows = await this.prisma.inventory.findMany({
        where: customWhere,
        include: { customProduct: true, staff: true, office: true },
        orderBy: { created_at: 'desc' },
      });

      const customProductCount = new Set(customRows.map((r) => r.customProductId)).size;

      if (page === 1) {
        for (const item of customRows) {
          const cp: any = item.customProduct;
          const cdata: any = cp?.data ?? {};
          const expiry = item.expiry_date instanceof Date
            ? item.expiry_date.toISOString().split('T')[0]
            : '';
          result.push({
            ...item,
            id: item.id,
            name: cp?.name ?? 'Custom Product',
            category: cdata.category ?? 'Custom',
            type: cdata.type ?? 'Custom',
            brand: item.brand ?? cdata.brand ?? 'N/A',
            batch: item.batch_no ?? 'N/A',
            expiry,
            supplier: cdata.manufacturer ?? cdata.supplier ?? 'Custom',
            available: item.quantity ?? 0,
            used: 0,
            damaged: 0,
            repair: 0,
            price: item.unit_price ?? 0,
            staffIn: item.staff ? `${item.staff.first_name} ${item.staff.last_name}` : 'N/A',
            room: item.room_number ?? '',
            productId: null,
            customProductId: item.customProductId,
            office_id: item.office_id,
            staff_id: item.staff_id,
            transaction_type: item.transaction_type,
            unit_price: item.unit_price ?? 0,
            _custom: cp,
            office: item.office ?? null,
            staff: item.staff ?? null,
            status: item.status ?? 'ACTIVE',
            source: 'custom',
          });
        }
      }

      const combinedTotal = totalProductsCount + customProductCount;

      return {
        data: result,
        totalProducts: combinedTotal,
        currentPage: page,
        // Pagination follows the marketplace product set; custom items (a small,
        // tenant-owned set) ride along on page 1 — avoids phantom empty pages.
        totalPages: Math.max(1, Math.ceil(totalProductsCount / limit)),
      };
    } catch (error) {
      console.error('Final inventory error:', error);
      return {
        data: [],
        totalProducts: 0,
        currentPage: page,
        totalPages: 0,
      };
    }
  }

  // ================= ANALYTICS SUGGESTIONS =================
  async getAnalyticsSuggestions(user: any, page = 1, limit = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cf = this.clientFilter(user);

    // ── Step 1: Fetch ALL Ledger OUT transactions (usage) ──────────────
    const outTransactions = await this.prisma.inventory.findMany({
      where: {
        transaction_type: 'OUT',
        status: { not: 'INACTIVE' },
        ...cf,
        NOT: { customProduct: { is: { is_active: false } } },
      },
      select: {
        productId: true,
        customProductId: true,
        quantity: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // ── Group usage by product ────────────────────────────────────────
    const usageMap = new Map<string, {
      totalUsage: number;
      firstDate: Date;
      lastDate: Date;
    }>();

    for (const tx of outTransactions) {
      const key = this.itemKeyOf(tx);
      if (!usageMap.has(key)) {
        usageMap.set(key, {
          totalUsage: tx.quantity,
          firstDate: tx.created_at,
          lastDate: tx.created_at,
        });
      } else {
        const entry = usageMap.get(key)!;
        entry.totalUsage += tx.quantity;
        if (tx.created_at < entry.firstDate) entry.firstDate = tx.created_at;
        if (tx.created_at > entry.lastDate) entry.lastDate = tx.created_at;
      }
    }

    // ── Step 2: Compute current stock per product from ALL ledger rows ─
    const allLedger = await this.prisma.inventory.findMany({
      where: { status: { not: 'INACTIVE' }, ...cf, NOT: { customProduct: { is: { is_active: false } } } },
      select: { productId: true, customProductId: true, transaction_type: true, quantity: true },
    });

    const stockMap = new Map<string, number>();
    for (const row of allLedger) {
      const delta = row.transaction_type === 'IN' ? row.quantity : -row.quantity;
      const key = this.itemKeyOf(row);
      stockMap.set(key, (stockMap.get(key) || 0) + delta);
    }

    // ── Step 3: Build name map for every item (catalog + custom) ───────
    const productIds = Array.from(usageMap.keys());
    const allKeys = Array.from(new Set([...usageMap.keys(), ...stockMap.keys()]));
    const catalogIds = allKeys.filter((k) => !k.startsWith('custom:'));
    const customIds = allKeys.filter((k) => k.startsWith('custom:')).map((k) => k.slice('custom:'.length));

    const products = await this.prisma.product.findMany({
      where: { id: { in: catalogIds } },
      select: { id: true, title: true },
    });
    const customProducts = await this.prisma.imsCustomProduct.findMany({
      where: { id: { in: customIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map<string, string>();
    products.forEach((p) => nameMap.set(p.id, p.title));
    customProducts.forEach((c) => nameMap.set(`custom:${c.id}`, c.name));

    // ── Step 4: Calculate analytics & categorize by risk ────────────────
    const allProducts: any[] = [];
    const includedProductIds: string[] = [];

    // First include all products with usage data
    for (const productId of productIds) {
      const currentStock = Math.max(stockMap.get(productId) || 0, 0);
      const usage = usageMap.get(productId)!;
      const productName = nameMap.get(productId) || 'Unknown';
      const totalUsage = usage.totalUsage;

      // Active days = (lastDate - firstDate) in days; if 0, treat as 1
      const first = new Date(usage.firstDate);
      first.setHours(0, 0, 0, 0);
      const last = new Date(usage.lastDate);
      last.setHours(0, 0, 0, 0);
      const diffMs = last.getTime() - first.getTime();
      let activeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (activeDays === 0) activeDays = 1;

      const averageDailyUsage = Math.round((totalUsage / activeDays) * 100) / 100;

      if (averageDailyUsage <= 0) continue;

      const estimatedDaysRemaining = currentStock / averageDailyUsage;

      const stockOutDate = new Date(today);
      stockOutDate.setDate(today.getDate() + Math.floor(estimatedDaysRemaining));
      const estimatedStockOutDate = stockOutDate.toISOString().split('T')[0];

      const suggestedRestockQuantity = Math.ceil(averageDailyUsage * 30);

      // Risk tiers
      let status: string;
      if (estimatedDaysRemaining <= 14) {
        status = 'High Risk';
      } else if (estimatedDaysRemaining <= 30) {
        status = 'Medium Risk';
      } else {
        status = 'Low Risk';
      }

      includedProductIds.push(productId);

      allProducts.push({
        productId,
        productName,
        currentStock,
        totalUsage,
        activeDays,
        averageDailyUsage,
        estimatedDaysRemaining: Math.round(estimatedDaysRemaining * 100) / 100,
        estimatedStockOutDate,
        suggestedRestockQuantity,
        status,
      });
    }

    // Also include products that have stock but no usage
    for (const [productId, stock] of stockMap) {
      if (includedProductIds.includes(productId)) continue;
      const currentStock = Math.max(stock, 0);
      if (currentStock <= 0) continue;
      const productName = nameMap.get(productId) || 'Unknown';

      allProducts.push({
        productId,
        productName,
        currentStock,
        totalUsage: 0,
        activeDays: 0,
        averageDailyUsage: 0,
        estimatedDaysRemaining: null,
        estimatedStockOutDate: null,
        suggestedRestockQuantity: null,
        status: 'No Usage Data',
      });
    }

    // ── Step 5: Sort by nearest stock-out date first ───────────────────
    // Products with usage (non-null estimatedDaysRemaining) come first, sorted ascending
    // Products with no usage come last
    allProducts.sort((a, b) => {
      if (a.estimatedDaysRemaining === null && b.estimatedDaysRemaining === null) return 0;
      if (a.estimatedDaysRemaining === null) return 1;
      if (b.estimatedDaysRemaining === null) return -1;
      return a.estimatedDaysRemaining - b.estimatedDaysRemaining;
    });

    // ── Step 6: Pagination ────────────────────────────────────────────
    const totalItems = allProducts.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * limit;
    const paginatedProducts = allProducts.slice(start, start + limit);

    // ── Step 7: Build daily graph data from Ledger OUT transactions ────
    // All products with usage, grouped by date, sorted ascending
    const dailyMap = new Map<string, number>();

    for (const tx of outTransactions) {
      if (!includedProductIds.includes(this.itemKeyOf(tx))) continue;
      const dateKey = tx.created_at.toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + tx.quantity);
    }

    const chartLabels: string[] = [];
    const chartValues: number[] = [];

    const sortedDates = Array.from(dailyMap.keys()).sort();
    for (const d of sortedDates) {
      chartLabels.push(d);
      chartValues.push(dailyMap.get(d)!);
    }

    return {
      products: paginatedProducts,
      totalItems,
      currentPage: safePage,
      totalPages,
      chartData: {
        labels: chartLabels,
        values: chartValues,
      },
    };
  }

  // ================= FIND ONE =================
  async findOne(id: string, user?: any) {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(id)) {
      throw new NotFoundException(`Inventory record with ID "${id}" not found`);
    }

    const item = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        product: true,
        customProduct: true,
        staff: true,
        office: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Inventory record with ID ${id} not found`,
      );
    }

    // Ownership check
    if (user && !user.is_system_admin && item.office?.client_id !== user.client_id) {
      throw new ForbiddenException('Access denied');
    }

    return item;
  }

  // ================= UPDATE =================
  async update(id: string, updateInventoryDto: UpdateInventoryDto, user?: any) {
    const item = await this.findOne(id, user);

    const { productName, productType, supplier, size, category, brand, ...inventoryData } = updateInventoryDto;

    // Update Product Table — marketplace products only (custom attrs live in their JSON).
    // Best-effort: updateMany won't throw P2025 if the product is missing.
    if (item.productId && (productName || productType || size || brand)) {
      await this.prisma.product.updateMany({
        where: { id: item.productId },
        data: {
          ...(productName && { title: productName }),
          ...(productType && { type: productType }),
          ...(size && { packaging: size }),
          ...(brand && { brand: brand }),
        }
      });
    }

    const result = await this.prisma.inventory.update({
      where: { id },
      data: {
        ...inventoryData,
        ...(brand && { brand: brand }),
        expiry_date: inventoryData.expiry_date
          ? new Date(inventoryData.expiry_date)
          : undefined,
      },
      include: {
        product: true,
        customProduct: true,
        staff: true,
        office: true,
      },
    });

    // --- ACTIVITY LOG ---
    if (productName) {
      this.activityService.create({
        action: 'Product edited',
        product: productName,
        user: result.staff ? `${result.staff.first_name} ${result.staff.last_name}` : undefined,
        office: result.office?.office_name,
      });
    }

    if (inventoryData.batch_no) {
      this.activityService.create({
        action: 'Batch updated',
        product: result.product?.title ?? result.customProduct?.name,
        user: result.staff ? `${result.staff.first_name} ${result.staff.last_name}` : undefined,
        office: result.office?.office_name,
      });
    }

    if (inventoryData.quantity !== undefined) {
      this.activityService.create({
        action: 'Inventory quantity adjusted',
        product: result.product?.title ?? result.customProduct?.name,
        user: result.staff ? `${result.staff.first_name} ${result.staff.last_name}` : undefined,
        office: result.office?.office_name,
      });
    }

    return result;
  }


  // ================= DELETE =================
  async remove(id: string, user: any, type?: string) {
    const cf = this.clientFilter(user);

    if (type === 'product') {
      const productId = id;
      const records = await this.prisma.inventory.findMany({
        where: { productId, ...cf }
      });

      let netStock = 0;
      records.forEach(r => {
        if (r.transaction_type === 'IN') netStock += r.quantity;
        else netStock -= r.quantity;
      });

      if (netStock > 0) {
        throw new BadRequestException('Cannot delete product until stock is 0.');
      }

      return this.prisma.inventory.deleteMany({
        where: { productId, ...cf }
      });
    }

    if (type === 'customProduct') {
      // Clear the inventory presence ONLY — soft-delete the ledger rows via status.
      // The catalog row (ims_custom_products) is left untouched so the product stays
      // in the "Custom Products" picker and can be re-stocked.
      const customProductId = id;
      const records = await this.prisma.inventory.findMany({
        where: { customProductId, ...cf }
      });

      let netStock = 0;
      records.forEach(r => {
        if (r.transaction_type === 'IN') netStock += r.quantity;
        else netStock -= r.quantity;
      });

      if (netStock > 0) {
        throw new BadRequestException('Cannot delete product until stock is 0.');
      }

      return this.prisma.inventory.updateMany({
        where: { customProductId, ...cf },
        data: { status: 'INACTIVE' },
      });
    }

    // Default item-level deletion
    const existing = await this.prisma.inventory.findUnique({
      where: { id },
      include: { product: true, customProduct: true, office: true }
    });
    if (!existing) throw new NotFoundException('Inventory record not found');

    // Ownership check
    if (!user.is_system_admin && existing.office?.client_id !== user.client_id) {
      throw new ForbiddenException('Access denied');
    }

    const res = await this.prisma.inventory.delete({
      where: { id },
    });

    this.activityService.create({
      action: 'Inventory record removed',
      product: existing.product?.title ?? existing.customProduct?.name,
      office: existing.office?.office_name,
      client_id: existing.office?.client_id,
    });

    return res;
  }

  // ================= LEDGER TRANSACTIONS =================
  async getLedgerTransactions(
    user: any,
    officeId?: string,
    type?: string,
    dateFrom?: string,
    dateTo?: string,
    inventoryType?: string,
  ) {
    const where: any = {
      ...this.clientFilter(user),
      NOT: { customProduct: { is: { is_active: false } } },
    };
    if (officeId) where.office_id = officeId;
    if (type) where.transaction_type = type;

    const inventoryTypeFilter = this.buildProductInventoryTypeFilter(inventoryType);
    if (inventoryTypeFilter) {
      // Custom items have no marketplace type; include them all so they aren't filtered out.
      where.OR = [
        { product: inventoryTypeFilter },
        { customProductId: { not: null } },
      ];
    }
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    const rows: any[] = await this.prisma.inventory.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        product: { select: { id: true, title: true } },
        customProduct: { select: { id: true, name: true, data: true } },
        staff: { select: { staff_id: true, first_name: true, last_name: true } },
        office: { select: { office_id: true, office_name: true } },
      },
    });

    // Map to a ledger-shaped response the UI expects
    return rows.map((r) => {
      let qty = `${r.quantity}`;
      let typeLabel = r.transaction_type as string;

      if (r.transaction_type === 'IN') {
        qty = `+${r.quantity}`;
        typeLabel = r.purpose?.includes('From: ') && r.purpose?.includes(' | Ref: TRN-') ? 'TRANSFER IN' : 'Received';
      } else if (r.transaction_type === 'TRANSFER') {
        qty = `-${r.quantity}`;
        typeLabel = 'TRANSFER OUT';
      } else if (r.transaction_type === 'OUT') {
        qty = `-${r.quantity}`;
        typeLabel = 'Used';
      } else if (r.transaction_type === 'ADJUSTMENT') {
        qty = `-${r.quantity}`;
      }

      return {
        id: r.id,
        date: r.created_at.toISOString().replace('T', ' ').slice(0, 16),
        product: r.product?.title ?? r.customProduct?.name ?? 'Unknown',
        batch: r.batch_no ?? '—',
        type: typeLabel,
        qty,
        price: String(r.unit_price || r.customProduct?.data?.unitPrice || r.customProduct?.data?.price || 0),
        balance: String(r.quantity),
        office: r.office?.office_name ?? '—',
        user: r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : '—',
        remarks: r.purpose ?? '',
        source: r.customProductId ? 'custom' : 'catalog',
      };
    });
  }

  // ================= LOW STOCK ALERTS =================
  async getLowStockAlerts(user: any, inventoryType?: string) {
    // Group inventory by product + office, sum IN quantities
    const where: any = {
      status: { not: 'INACTIVE' },
      ...this.clientFilter(user),
      NOT: { customProduct: { is: { is_active: false } } },
    };
    const inventoryTypeFilter = this.buildProductInventoryTypeFilter(inventoryType);
    if (inventoryTypeFilter) {
      const normalizedType = inventoryType?.trim().toUpperCase();
      where.OR = [
        { product: inventoryTypeFilter },
        { customProduct: { is: { inventory_type: normalizedType as any } } },
      ];
    }

    const raw: any[] = await this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            inventoryTypeId: true,
            inventoryTypeRelation: {
              select: {
                name: true,
              },
            },
          },
        },
        customProduct: { select: { id: true, name: true, inventory_type: true } },
        office: { select: { office_id: true, office_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Aggregate: product+office → total qty
    const map = new Map<string, {
      product: string; batch: string; office: string;
      qty: number; threshold: number;
      inventoryType: string;
    }>();

    for (const r of raw) {
      const key = `${this.itemKeyOf(r)}||${r.office_id}`;
      const delta = r.transaction_type === 'IN'
        ? r.quantity
        : -r.quantity;

      if (map.has(key)) {
        map.get(key)!.qty += delta;
      } else {
        map.set(key, {
          product: r.product?.title ?? r.customProduct?.name ?? 'Unknown',
          batch: r.batch_no ?? '—',
          office: r.office?.office_name ?? '—',
          qty: delta,
          threshold: 20, // default threshold — can be per-product later
          inventoryType: r.customProductId
            ? (r.customProduct?.inventory_type ?? this.DEFAULT_INVENTORY_TYPE_NAME)
            : (r.product?.inventoryTypeRelation?.name ||
              (r.product?.inventoryTypeId ? '' : this.DEFAULT_INVENTORY_TYPE_NAME)),
        });
      }
    }

    // Only return items below threshold
    const alerts: any[] = [];
    for (const v of map.values()) {
      if (v.qty < v.threshold) {
        const pct = v.qty / v.threshold;
        const status = pct <= 0.3 ? 'Critical' : pct <= 0.7 ? 'Low' : 'Risk';
        alerts.push({ ...v, qty: String(v.qty), threshold: String(v.threshold), status });
      }
    }

    return alerts.sort((a, b) => Number(a.qty) - Number(b.qty));
  }

  // ================= NEAR EXPIRY COUNT (KPI) =================
  async getNearExpiryCount(user: any, daysAhead = 30) {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const count = await this.prisma.inventory.count({
      where: {
        expiry_date: { gte: now, lte: cutoff },
        status: { not: 'INACTIVE' },
        ...this.clientFilter(user),
        OR: [
          { product: this.buildProductInventoryTypeFilter(this.DEFAULT_INVENTORY_TYPE_NAME) || undefined },
          { customProduct: { is: { inventory_type: this.DEFAULT_INVENTORY_TYPE_NAME as any, is_active: true } } },
        ],
      },
    });

    return { count, threshold: daysAhead };
  }

  // ================= NEAR EXPIRY ALERTS =================
  async getNearExpiryAlerts(user: any, daysAhead = 60) {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const where: any = {
      expiry_date: { gte: now, lte: cutoff },
      status: { not: 'INACTIVE' },
      ...this.clientFilter(user),
      OR: [
        { product: this.buildProductInventoryTypeFilter(this.DEFAULT_INVENTORY_TYPE_NAME) || undefined },
        { customProduct: { is: { inventory_type: this.DEFAULT_INVENTORY_TYPE_NAME as any, is_active: true } } },
      ],
    };

    const rows: any[] = await this.prisma.inventory.findMany({
      where,
      include: {
        product: { select: { id: true, title: true } },
        customProduct: { select: { id: true, name: true } },
        office: { select: { office_id: true, office_name: true } },
      },
      orderBy: { expiry_date: 'asc' }, // FEFO — earliest expiry first
    });

    return rows.map((r) => {
      const msDiff = r.expiry_date!.getTime() - now.getTime();
      const daysLeft = Math.floor(msDiff / (1000 * 60 * 60 * 24));

      const status =
        daysLeft <= 15 ? 'Urgent'
          : daysLeft <= 30 ? 'High Risk'
            : daysLeft <= 45 ? 'Warning'
              : 'Monitor';

      return {
        product: r.product?.title ?? r.customProduct?.name ?? 'Unknown',
        batch: r.batch_no ?? '—',
        expiry: r.expiry_date!.toISOString().slice(0, 10),
        daysLeft,
        office: r.office?.office_name ?? '—',
        status,
      };
    });
  }
}
