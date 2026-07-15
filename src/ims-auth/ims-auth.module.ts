import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImsAuthService } from './ims-auth.service';
import { ImsAuthController } from './ims-auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { ImsNotificationModule } from '../ims-notification/ims-notification.module';

@Module({
    imports: [
        PrismaModule,
        MailerModule,
        ImsNotificationModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRY_TIME'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [ImsAuthController],
    providers: [ImsAuthService],
    exports: [ImsAuthService],
})
export class ImsAuthModule { }
