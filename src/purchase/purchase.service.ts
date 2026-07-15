import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {
    constructor(private prisma: PrismaService) { }

    async createPurchase(dto: CreatePurchaseDto) {
        const { client_id, details, remarks, is_quotation = false } = dto;

        // Check if client exists
        const client = await this.prisma.imsUser.findUnique({
            where: { client_id },
        });
        if (!client) throw new NotFoundException('Client not found');

        // Fetch product details to get correct prices
        const productIds = details.map((d) => d.productId);
        const dbProducts = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { variants: true },
        });

        const productPriceMap = new Map();
        dbProducts.forEach((p) => {
            productPriceMap.set(p.id, p.variants?.[0]?.price || 0);
        });

        // Create PurchaseOrder and details in a transaction
        return this.prisma.$transaction(async (tx) => {
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    client_id,
                    is_quotation,
                    quotation_date: new Date(),
                    purchase_date: !is_quotation ? new Date() : null, // Set purchase date only if it's a purchase
                    status: 'PENDING',
                    remarks,
                },
            });

            const detailData = details.map((d) => {
                const dbPrice = productPriceMap.get(d.productId) || 0;
                return {
                    purchase_id: purchaseOrder.purchase_id,
                    productId: d.productId,
                    quantity: Math.max(1, d.quantity),
                    unit_price: dbPrice, // Use DB price for security
                    description: d.description,
                };
            });

            await tx.purchaseOrderDetail.createMany({
                data: detailData,
            });

            return tx.purchaseOrder.findUnique({
                where: { purchase_id: purchaseOrder.purchase_id },
                include: { details: { include: { product: true } } },
            });
        });
    }

    async getProposals(clientId: string) {
        return this.prisma.purchaseOrder.findMany({
            where: {
                client_id: clientId,
                is_quotation: true,
            },
            include: {
                details: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async getPurchases(clientId: string) {
        return this.prisma.purchaseOrder.findMany({
            where: {
                client_id: clientId,
                is_quotation: false,
            },
            include: {
                details: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async acceptProposal(id: string) {
        const proposal = await this.prisma.purchaseOrder.findUnique({
            where: { purchase_id: id },
        });

        if (!proposal || !proposal.is_quotation) {
            throw new NotFoundException('Proposal not found');
        }

        return this.prisma.purchaseOrder.update({
            where: { purchase_id: id },
            data: {
                is_quotation: false,
                status: 'ACCEPTED',
                purchase_date: new Date(), // Reset date to acceptance date
            },
        });
    }

    async rejectProposal(id: string) {
        const proposal = await this.prisma.purchaseOrder.findUnique({
            where: { purchase_id: id },
        });

        if (!proposal || !proposal.is_quotation) {
            throw new NotFoundException('Proposal not found');
        }

        return this.prisma.purchaseOrder.update({
            where: { purchase_id: id },
            data: {
                status: 'REJECTED',
            },
        });
    }
}
