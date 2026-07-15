import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { MailerService } from "src/mailer/mailer.service";
import { StripeService } from "src/payment/payment.service"; import { PermissionsGuard } from "./guard/permissions.guard";


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
  controllers: [UserController],
  providers: [UserService, JwtStrategy, MailerService, StripeService, PermissionsGuard],
  exports: [UserService, PermissionsGuard],
})
export class UserModule { }
