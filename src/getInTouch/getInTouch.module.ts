import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { GetInTouchController } from "./getInTouch.controller";
import { GetInTouchService } from "./getInTouch.service";
import { JwtStrategy } from "src/user/strategy/jwt.strategy";
import { MailerModule } from "src/mailer/mailer.module";

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
    MailerModule
  ],
  controllers: [GetInTouchController],
  providers: [GetInTouchService, JwtStrategy],
})
export class GetInTouchModule {}
