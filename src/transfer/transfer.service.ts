import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { SystemActivityService } from '../system-activity/system-activity.service';

@Injectable()
export class TransferService {
    constructor(
        private prisma: PrismaService,
        private activityService: SystemActivityService,
    ) { }

    async create(dto: CreateTransferDto) {
        // Verify client exists if provided
        if (dto.client_id) {
            const client = await this.prisma.imsUser.findUnique({
                where: { client_id: dto.client_id },
            });
            if (!client) throw new NotFoundException('Client (ImsUser) not found');
        }

        // Verify source office exists
        const sourceOffice = await this.prisma.office.findUnique({
            where: { office_id: dto.source_office_id },
        });
        if (!sourceOffice) throw new NotFoundException('Source office not found');

        // Verify destination office exists
        const destOffice = await this.prisma.office.findUnique({
            where: { office_id: dto.destination_office_id },
        });
        if (!destOffice) throw new NotFoundException('Destination office not found');

        const { details, ...transferData } = dto;

        const result = await this.prisma.transfer.create({
            data: {
                ...transferData,
                transfer_date: new Date(dto.transfer_date),
                status: dto.status ?? 'Pending',
                details: {
                    create: details.map((d) => ({
                        productId: d.productId,
                        qty: d.qty,
                    })),
                },
            } as any,
            include: {
                details: {
                    include: {
                        product: {
                            include: {
                                inventoryTypeRelation: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        this.activityService.create({
            action: 'Stock transfer initiated',
            office: `${sourceOffice?.office_name} -> ${destOffice?.office_name}`,
            client_id: result.client_id,
        });

        return result;
    }

    async findAll() {
        return this.prisma.transfer.findMany({
            include: {
                details: {
                    include: {
                        product: {
                            include: {
                                inventoryTypeRelation: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const transfer = await this.prisma.transfer.findUnique({
            where: { id },
            include: {
                details: {
                    include: {
                        product: {
                            include: {
                                inventoryTypeRelation: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!transfer) throw new NotFoundException('Transfer not found');
        return transfer;
    }

    async findByClient(client_id: string) {
        return this.prisma.transfer.findMany({
            where: { client_id },
            include: {
                details: {
                    include: {
                        product: {
                            include: {
                                inventoryTypeRelation: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async update(id: string, dto: UpdateTransferDto) {
        const transfer = await this.prisma.transfer.findUnique({
            where: { id },
            include: {
                details: {
                    include: {
                        product: {
                            include: {
                                inventoryTypeRelation: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    }
                }
            }
        });
        if (!transfer) throw new NotFoundException('Transfer not found');

        // Fetch office names for logging
        const sourceOffice = await this.prisma.office.findUnique({ where: { office_id: transfer.source_office_id } });
        const destOffice = await this.prisma.office.findUnique({ where: { office_id: transfer.destination_office_id } });

        // If status changes to Completed or In Transit
        if (dto.status === 'Completed' || dto.status === 'In Transit' || dto.status === 'Received') {
            // Prevent double-processing
            if (transfer.status === 'Completed' || transfer.status === 'Received') {
                return transfer; // Already processed
            }

            // Only deduct inventory when finally completing / receiving
            if (dto.status === 'Completed' || dto.status === 'Received' || dto.status === 'In Transit') {
                const transferRef = `TRN-${transfer.id.slice(0, 8)}`;

                let assignedStaffId = dto.staff_id;
                if (!assignedStaffId) {
                    let fallbackStaff = await this.prisma.staff.findFirst({ where: { client_id: transfer.client_id } });
                    if (!fallbackStaff) {
                        fallbackStaff = await this.prisma.staff.findFirst();
                    }
                    if (!fallbackStaff) {
                        throw new BadRequestException("No staff members exist in the system to assign this ledger change. Please create at least one staff member first.");
                    }
                    assignedStaffId = fallbackStaff.staff_id;
                }

                for (const detail of transfer.details) {
                    const product = detail.product as any;
                    if (!product) continue;

                    const inventoryTypeName = product.inventoryTypeRelation?.name || (product.inventoryTypeId ? '' : 'CONSUMABLE');
                    const isConsumable = inventoryTypeName === 'CONSUMABLE';

                    const records = await this.prisma.inventory.findMany({
                        where: { productId: detail.productId, office_id: transfer.source_office_id }
                    });

                    if (isConsumable) {
                        const batchMap = new Map<string, { qty: number, expiry: Date | null, brand: string | null }>();
                        records.forEach(r => {
                            const bKey = r.batch_no || 'NO_BATCH';
                            const existing = batchMap.get(bKey) || { qty: 0, expiry: r.expiry_date, brand: r.brand };
                            if (r.transaction_type === 'IN') existing.qty += r.quantity;
                            else existing.qty -= r.quantity;
                            batchMap.set(bKey, existing);
                        });

                        const sortedBatches = Array.from(batchMap.entries())
                            .filter(([_, v]) => v.qty > 0)
                            .sort((a, b) => {
                                if (!a[1].expiry) return 1;
                                if (!b[1].expiry) return -1;
                                return a[1].expiry.getTime() - b[1].expiry.getTime();
                            });

                        const totalAvailable = sortedBatches.reduce((acc, b) => acc + b[1].qty, 0);
                        if (totalAvailable < detail.qty) {
                            throw new BadRequestException(`Insufficient stock for Product ${product.title} at Source Office. Available: ${totalAvailable}, Requested: ${detail.qty}`);
                        }

                        let remainingToTransfer = detail.qty;
                        for (const [batchNo, batchInfo] of sortedBatches) {
                            if (remainingToTransfer <= 0) break;
                            const transferQty = Math.min(batchInfo.qty, remainingToTransfer);

                            await this.prisma.$transaction([
                                this.prisma.inventory.create({
                                    data: {
                                        productId: detail.productId,
                                        office_id: transfer.source_office_id,
                                        staff_id: assignedStaffId,
                                        quantity: transferQty,
                                        batch_no: batchNo === 'NO_BATCH' ? null : batchNo,
                                        expiry_date: batchInfo.expiry,
                                        brand: batchInfo.brand,
                                        transaction_type: 'TRANSFER',
                                        purpose: `To: ${destOffice?.office_name || 'Destination'} | Ref: ${transferRef}`,
                                        status: 'ACTIVE',
                                        unit_price: 0
                                    }
                                }),
                                this.prisma.inventory.create({
                                    data: {
                                        productId: detail.productId,
                                        office_id: transfer.destination_office_id,
                                        staff_id: assignedStaffId,
                                        quantity: transferQty,
                                        batch_no: batchNo === 'NO_BATCH' ? null : batchNo,
                                        expiry_date: batchInfo.expiry,
                                        brand: batchInfo.brand,
                                        transaction_type: 'IN',
                                        purpose: `From: ${sourceOffice?.office_name || 'Source'} | Ref: ${transferRef}`,
                                        status: 'ACTIVE',
                                        unit_price: 0
                                    }
                                })
                            ]);
                            remainingToTransfer -= transferQty;
                        }
                    } else {
                        let netStock = 0;
                        records.forEach(r => {
                            if (r.transaction_type === 'IN') netStock += r.quantity;
                            else netStock -= r.quantity;
                        });

                        if (netStock < detail.qty) {
                            throw new BadRequestException(`Insufficient stock for Product ${product.title} at Source Office.`);
                        }

                        await this.prisma.$transaction([
                            this.prisma.inventory.create({
                                data: {
                                    productId: detail.productId,
                                    office_id: transfer.source_office_id,
                                    staff_id: assignedStaffId,
                                    quantity: detail.qty,
                                    unit_price: 0,
                                    status: 'ACTIVE',
                                    transaction_type: 'TRANSFER',
                                    purpose: `To: ${destOffice?.office_name || 'Destination'} | Ref: ${transferRef}`,
                                }
                            }),
                            this.prisma.inventory.create({
                                data: {
                                    productId: detail.productId,
                                    office_id: transfer.destination_office_id,
                                    staff_id: assignedStaffId,
                                    quantity: detail.qty,
                                    unit_price: 0,
                                    status: 'ACTIVE',
                                    transaction_type: 'IN',
                                    purpose: `From: ${sourceOffice?.office_name || 'Source'} | Ref: ${transferRef}`,
                                }
                            })
                        ]);
                    }
                }
                dto.status = 'Completed';
            }
        }

        const result = await this.prisma.transfer.update({
            where: { id },
            data: { status: dto.status },
            include: {
                details: {
                    include: { product: true },
                },
            },
        });

        this.activityService.create({
            action: `Transfer status: ${result.status}`,
            office: `${sourceOffice?.office_name} -> ${destOffice?.office_name}`,
            client_id: result.client_id,
        });

        return result;
    }

    async remove(id: string) {
        const transfer = await this.prisma.transfer.findUnique({
            where: { id },
        });
        if (!transfer) throw new NotFoundException('Transfer not found');

        await this.prisma.transferDetail.deleteMany({
            where: { transfer_id: id },
        });

        return this.prisma.transfer.delete({
            where: { id },
        });
    }
}
