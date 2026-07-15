import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Req,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImsAgreementService } from './ims-agreement.service';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Permissions } from '../user/guard/permissions.decorator';
import { UpdateAgreementDto } from './dto/update-agreement.dto';

@Controller('ims-agreement')
@UseGuards(JwtGuard, PermissionsGuard)
export class ImsAgreementController {
    constructor(private readonly agreementService: ImsAgreementService) { }

    @Post('upload')
    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadPdf(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        if (!req.user.is_system_admin) {
            throw new ForbiddenException();
        }
        return this.agreementService.uploadPdf(file);
    }

    @Post('create/:clientId')
    @Permissions('demo.manage')
    createAgreement(
        @Param('clientId') clientId: string,
        @Body() dto: UpdateAgreementDto,
        @Req() req: any,
    ) {
        return this.agreementService.createAgreement(clientId, dto, req.user);
    }

    @Patch(':id/status')
    @Permissions('demo.manage')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateAgreementDto,
        @Req() req: any,
    ) {
        return this.agreementService.updateStatus(id, dto, req.user);
    }

    @Get('client/:clientId')
    @Permissions('demo.manage')
    findByClient(@Param('clientId') clientId: string, @Req() req: any) {
        return this.agreementService.findByClient(clientId, req.user);
    }
}
