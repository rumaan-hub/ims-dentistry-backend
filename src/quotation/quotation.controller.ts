// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { QuotationService } from './quotation.service';
// import { CreateQuotationDto } from './dto/create-quotation.dto';
// import { UpdateQuotationDto } from './dto/update-quotation.dto';

// @Controller('ims/quotation')
// export class QuotationController {
//     constructor(private readonly quotationService: QuotationService) { }

//     @Post()
//     create(@Body() createQuotationDto: CreateQuotationDto) {
//         return this.quotationService.create(createQuotationDto);
//     }

//     @Get()
//     findAll() {
//         return this.quotationService.findAll();
//     }

//     @Get('client/:client_id')
//     findByClient(@Param('client_id') client_id: string) {
//         return this.quotationService.findByClient(client_id);
//     }

//     @Get(':id')
//     findOne(@Param('id') id: string) {
//         return this.quotationService.findOne(id);
//     }

//     @Patch(':id')
//     update(@Param('id') id: string, @Body() updateQuotationDto: UpdateQuotationDto) {
//         return this.quotationService.update(id, updateQuotationDto);
//     }

//     @Delete(':id')
//     remove(@Param('id') id: string) {
//         return this.quotationService.remove(id);
//     }
// }
