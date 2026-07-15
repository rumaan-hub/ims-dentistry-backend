import { forwardRef, Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtGuard } from "./user/guard/jwt.guard";
import { TenantInterceptor } from "./user/guard/tenant.interceptor";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { configuration, AppConfigService } from "./services";
import { ProductModule } from "./products/products.module";
import { UserModule } from "./user/user.module";
import { CategoryModule } from "./categories/categories.module";
// import { SubCategoryModule } from "./subCategories/subCategory.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { SuperAdminModule } from "./superAdmin/superAdmin.module";
import { VendorModule } from "./vendor/vendor.module";
import { AdminModule } from "./admin/admin.module";
import { MailerModule } from "./mailer/mailer.module";
import { UploadFileModule } from "./upload-file/upload-file.module";
import { AddressModule } from "./address/address.module";
import { LicenseModule } from "./license/license.module";
import { MaterialModule } from "./material/material.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { ScheduleModule } from "@nestjs/schedule";
import { QuestionAnswerModule } from "./questionAnswer/questionAnswer.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { GetInTouchModule } from "./getInTouch/getInTouch.module";
import { UspsModule } from "./usps/usps.module";
import { ChatModule } from "./chat/chat.module";
import { StripeModule } from "./payment/payment.module";
import { AutoOrderModule } from "./autoOrder/autoOrder.module";
import { QueueService } from "./redis/queue.service";
import { QueueWorker } from "./redis/queue.worker";
import { RedisService } from "./redis/redis.service";
import { RedisModule } from "./redis/redis.module";
import { StripeService } from "./payment/payment.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { NotificationModule } from "./notifications/notifications.module";
import { CommissionModule } from "./commission/commission.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { ClientModule } from "./client/client.module";
import { OfficeModule } from "./office/office.module";
import { InventoryModule } from "./inventory/inventory.module";
// import { InventoryModule } from "./inventory/inventory.module";
import { StaffModule } from "./staff/staff.module";
// import { QuotationModule } from "./quotation/quotation.module";
// import { QuotationModule } from "./quotation/quotation.module";
import { TransferModule } from "./transfer/transfer.module";
import { SystemActivityModule } from "./system-activity/system-activity.module";
import { PurchaseModule } from "./purchase/purchase.module";
import { RbacModule } from "./rbac/rbac.module";
import { ImsAuthModule } from "./ims-auth/ims-auth.module";
import { InventoryTypeModule } from "./inventory-type/inventory-type.module";
import { ImsDemoModule } from "./ims-demo/ims-demo.module";
import { ImsAgreementModule } from "./ims-agreement/ims-agreement.module";
import { ImsSubscriptionModule } from "./ims-subscription/ims-subscription.module";
import { ImsCheckoutModule } from "./ims-checkout/ims-checkout.module";
import { ImsNotificationModule } from "./ims-notification/ims-notification.module";
import { BannerModule } from "./banner/banner.module";
import { BlogModule } from "./blog/blog.module";
import { BundleModule } from "./bundle/bundle.module";
import { ImsCustomProductModule } from "./ims-custom-product/ims-custom-product.module";


@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    PrismaModule,
    AddressModule,
    UserModule,
    LicenseModule,
    CategoryModule,
    // SubCategoryModule,
    ProductModule,
    AdminModule,
    CartModule,
    OrdersModule,
    SuperAdminModule,
    ReviewsModule,
    VendorModule,
    MailerModule,
    UploadFileModule,
    MaterialModule,
    WishlistModule,
    QuestionAnswerModule,
    GetInTouchModule,
    UspsModule,
    StripeModule,
    AutoOrderModule,
    RedisModule,
    ChatModule,
    EventEmitterModule,
    CommissionModule,
    PromotionsModule,
    ClientModule,
    OfficeModule,
    InventoryModule,
    InventoryModule,
    StaffModule,
    // QuotationModule,
    // QuotationModule,
    TransferModule,
    SystemActivityModule,
    PurchaseModule,
    RbacModule,
    ImsAuthModule,
    InventoryTypeModule,
    ImsDemoModule,
    ImsAgreementModule,
    ImsSubscriptionModule,
    ImsCheckoutModule,
    ImsNotificationModule,
    BannerModule,
    BlogModule,
    BundleModule,
    ImsCustomProductModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppConfigService,
    QueueService,
    QueueWorker,
    RedisService,
    StripeService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule { }
