// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateQuotationDto } from './dto/create-quotation.dto';
// import { UpdateQuotationDto } from './dto/update-quotation.dto';

// @Injectable()
// export class QuotationService {
//     constructor(private prisma: PrismaService) { }

//     async create(dto: CreateQuotationDto) {
//         if (dto.client_id) {
//             const client = await this.prisma.imsUser.findUnique({
//                 where: { client_id: dto.client_id },
//             });
//             if (!client) throw new NotFoundException('Client (ImsUser) not found');
//         }

//         return this.prisma.quotation.create({
//             data: dto as any,
//             include: {
//                 user: true,
//             },
//         });
//     }

//     async findAll() {
//         return this.prisma.quotation.findMany({
//             include: {
//                 user: true,
//             },
//             orderBy: {
//                 created_at: 'desc',
//             },
//         });
//     }

//     async findOne(id: string) {
//         const quotation = await this.prisma.quotation.findUnique({
//             where: { quotation_id: id },
//             include: {
//                 user: true,
//             },
//         });
//         if (!quotation) throw new NotFoundException('Quotation not found');
//         return quotation;
//     }

//     async findByClient(client_id: string) {
//         return this.prisma.quotation.findMany({
//             where: { client_id },
//             include: {
//                 user: true,
//             },
//             orderBy: {
//                 created_at: 'desc',
//             },
//         });
//     }

//     async update(id: string, dto: UpdateQuotationDto) {
//         const quotation = await this.prisma.quotation.findUnique({
//             where: { quotation_id: id },
//         });
//         if (!quotation) throw new NotFoundException('Quotation not found');

//         return this.prisma.quotation.update({
//             where: { quotation_id: id },
//             data: dto,
//             include: {
//                 user: true,
//             },
//         });
//     }

//     async remove(id: string) {
//         const quotation = await this.prisma.quotation.findUnique({
//             where: { quotation_id: id },
//         });
//         if (!quotation) throw new NotFoundException('Quotation not found');

//         return this.prisma.quotation.delete({
//             where: { quotation_id: id },
//         });
//     }
// }
