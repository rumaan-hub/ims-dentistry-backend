// import { Module } from "@nestjs/common";
// import { ConfigModule, ConfigService } from "@nestjs/config";
// import { PrismaModule } from "src/prisma/prisma.module";
// import { JwtModule } from "@nestjs/jwt";
// import { SubCategoryController } from "./subCategory.controller";
// import { SubCategoryService } from "./subCategory.service";
// import { JwtStrategy } from "src/user/strategy/jwt.strategy";

// @Module({
//   imports: [
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>("JWT_SECRET"),
//         signOptions: {
//           expiresIn: configService.get<string>("JWT_EXPIRY_TIME"),
//         },
//       }),
//       inject: [ConfigService],
//     }),
//     PrismaModule,
//   ],
//   controllers: [SubCategoryController],
//   providers: [SubCategoryService, JwtStrategy],
// })
// export class SubCategoryModule {}
