import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "src/user/strategy/jwt.strategy";
import { SuperAdminService } from "./superAdmin.service";
import { SuperAdminController } from "./superAdmin.controller";
import { MailerService } from "src/mailer/mailer.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRY_TIME"),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, JwtStrategy, MailerService],
})
export class SuperAdminModule {}
