// import { Module } from "@nestjs/common";
// import { ConfigModule, ConfigService } from "@nestjs/config";
// import { PrismaModule } from "src/prisma/prisma.module";
// import { JwtModule } from "@nestjs/jwt";
// import { JwtStrategy } from "src/user/strategy/jwt.strategy";
// import { CourierServiceController } from "./courierService.controller";
// import { CourierServiceService } from "./courierService.service";

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
//   controllers: [CourierServiceController],
//   providers: [CourierServiceService, JwtStrategy],
//   exports: [CourierServiceService],
// })
// export class CourierServiceModule {}
