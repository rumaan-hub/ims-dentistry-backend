import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "src/prisma/prisma.module";
import { BlogController } from "./blog.controller";
import { BlogService } from "./blog.service";
import { JwtStrategy } from "src/user/strategy/jwt.strategy";

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
  controllers: [BlogController],
  providers: [BlogService, JwtStrategy],
})
export class BlogModule {}
