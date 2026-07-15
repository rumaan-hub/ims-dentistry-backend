import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomProductDto } from './dto/create-custom-product.dto';
import { UpdateCustomProductDto } from './dto/update-custom-product.dto';

interface FindAllOpts {
  search?: string;
  page?: number;
  limit?: number;
  inventoryType?: string;
}

@Injectable()
export class ImsCustomProductService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(clientId: string, dto: CreateCustomProductDto) {
    try {
      return await this.prisma.imsCustomProduct.create({
        data: {
          client_id: clientId,
          name: dto.name,
          data: dto.data ?? {},
          ...(dto.inventory_type && { inventory_type: dto.inventory_type }),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('A custom product with this name already exists.');
      }
      throw e;
    }
  }

  // GET ALL (this client's own products) — search + pagination + inventory_type filter
  async findAll(clientId: string, opts: FindAllOpts = {}) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.max(1, opts.limit ?? 50);
    const where: any = { client_id: clientId, is_active: true };
    if (opts.search?.trim()) {
      where.name = { contains: opts.search.trim(), mode: 'insensitive' };
    }
    if (opts.inventoryType?.trim()) {
      where.inventory_type = opts.inventoryType.trim().toUpperCase();
    }

    const [data, total] = await Promise.all([
      this.prisma.imsCustomProduct.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.imsCustomProduct.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  // GET SINGLE
  async findOne(id: string, clientId: string) {
    const product = await this.prisma.imsCustomProduct.findFirst({
      where: { id, client_id: clientId, is_active: true },
    });
    if (!product) {
      throw new HttpException('Custom product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  // UPDATE
  async update(id: string, clientId: string, dto: UpdateCustomProductDto) {
    await this.findOne(id, clientId); // ensures it exists + belongs to this client
    try {
      return await this.prisma.imsCustomProduct.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.data && { data: dto.data }),
          ...(dto.inventory_type && { inventory_type: dto.inventory_type }),
          updated_at: new Date(),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('A custom product with this name already exists.');
      }
      throw e;
    }
  }

  // SOFT DELETE — blocked while net stock > 0 (mirrors the catalog delete guard)
  async remove(id: string, clientId: string) {
    await this.findOne(id, clientId);

    const rows = await this.prisma.inventory.findMany({
      where: { customProductId: id },
      select: { transaction_type: true, quantity: true },
    });
    let net = 0;
    for (const r of rows) {
      net += r.transaction_type === 'IN' ? r.quantity : -r.quantity;
    }
    if (net > 0) {
      throw new BadRequestException(
        `Cannot delete: this custom product still has ${net} in stock. Reduce stock to 0 first.`,
      );
    }

    return this.prisma.imsCustomProduct.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
