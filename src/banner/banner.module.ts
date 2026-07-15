import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "src/prisma/prisma.module";
import { BannerController } from "./banner.controller";
import { BannerService } from "./banner.service";
import { UploadFileService } from "src/upload-file/upload-file.service";
import { AppConfigService } from "src/services";

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
  controllers: [BannerController],
  providers: [BannerService, UploadFileService, AppConfigService, JwtModule],
})
export class BannerModule {}

