-- CreateEnum
CREATE TYPE "ProductInventoryType" AS ENUM ('CONSUMABLE', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('FREE_SHIPPING', 'BUY_X_GET_Y', 'BUNDLE_DEALS', 'SPEND_MONEY');

-- CreateEnum
CREATE TYPE "EligibleCustomerType" AS ENUM ('ALL', 'ADD_CUSTOMER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('NEW', 'REPEATED', 'HIGH_SPEND', 'NEWS_LETTER');

-- CreateEnum
CREATE TYPE "DeliveryOption" AS ENUM ('STANDARD', 'PREMIUM', 'LUXURY', 'EXPRESS');

-- CreateEnum
CREATE TYPE "DurationType" AS ENUM ('LONG_TIME', 'SELECTED_TIME');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'CANCELLED', 'REQUIRES_ACTION');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VENDOR', 'ADMIN', 'SUPER_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'IN_ACTIVE');

-- CreateEnum
CREATE TYPE "vendorStatus" AS ENUM ('APPROVE', 'REJECT', 'BLOCK', 'RESUBMIT', 'PENDING');

-- CreateEnum
CREATE TYPE "productStatus" AS ENUM ('PENDING', 'REJECT', 'APPROVE');

-- CreateEnum
CREATE TYPE "BussinessType" AS ENUM ('HEALTH_CARE', 'NON_HEALTH_CARE');

-- CreateEnum
CREATE TYPE "HealthCareBusinessType" AS ENUM ('DENTAL_PRACTICE', 'EDUCATIONAL_OR_GOVERNMENT_DENTAL_FACILITY', 'DENTAL_SERVICE', 'OTHERS');

-- CreateEnum
CREATE TYPE "Speciality" AS ENUM ('GENERAL_DENTISTRY', 'ORTHODONTICS', 'ORAL_SURGERY', 'PERIODONTICS', 'ENDODONTICS', 'PROSTHODONTICS', 'PEDODONTICS');

-- CreateEnum
CREATE TYPE "VendorBusinessType" AS ENUM ('INDIVIDUAL_PROFILE', 'BUSINESS_PROFILE');

-- CreateEnum
CREATE TYPE "ReturnOrderStatus" AS ENUM ('RETURNED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'PACKED', 'INPROGRESS', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderRemarks" AS ENUM ('REQUEST_INITIATED', 'REACHED_WAREHOUSE', 'QUALITY_CHECK', 'RETURN_RESULT', 'REFUND_PENDING', 'REFUND_ISSUED');

-- CreateEnum
CREATE TYPE "CancelOrderStatus" AS ENUM ('CANCELED', 'REFUND_PENDING', 'REFUND_ISSUED');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('PLACED', 'INPROGRESS', 'PACKED', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('SOLD_ITEM', 'WHOLE_ORDER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RETURNED', 'REFUND', 'REFUND_PENDING', 'RETURN_PENDING');

-- CreateEnum
CREATE TYPE "VendorTransfersStatus" AS ENUM ('PENDING', 'REVERSED', 'COMPLETED', 'REJECTED', 'INSUFFICIENT_FUNDS');

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('FLAT', 'UPS');

-- CreateEnum
CREATE TYPE "IMSTransactionType" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('PURCHASE', 'SALE', 'TRANSFER', 'RETURN', 'OPENING');

-- CreateEnum
CREATE TYPE "IMSStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "slug" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "id" TEXT NOT NULL,
    "review" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sellerRating" TEXT NOT NULL,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "images" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answers" (
    "id" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptiveTitle" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[],
    "description" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "manufacturer" TEXT,
    "packaging" TEXT,
    "materialId" TEXT,
    "type" TEXT,
    "vasoconstrictor" TEXT,
    "sds" TEXT,
    "style" TEXT,
    "sterility" TEXT,
    "properties" TEXT,
    "construction" TEXT,
    "dilutionRatio" TEXT,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disapprovalMsg" TEXT,
    "height" TEXT,
    "intoWishList" BOOLEAN,
    "length" TEXT,
    "rating" TEXT,
    "video" TEXT,
    "weight" TEXT,
    "width" TEXT,
    "status" "productStatus" NOT NULL DEFAULT 'PENDING',
    "bannerImage" TEXT,
    "reason" TEXT,
    "scent" TEXT,
    "viscosity" TEXT,
    "fluidResistance" TEXT,
    "filtrationRate" TEXT,
    "brand" TEXT,
    "isLicenseRequired" BOOLEAN NOT NULL DEFAULT false,
    "deliveryOptions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'UPS',
    "flatRate" DOUBLE PRECISION DEFAULT 0,
    "inventoryTypeId" TEXT,
    "inventoryType" "ProductInventoryType" NOT NULL DEFAULT 'CONSUMABLE',

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "PromotionType" NOT NULL,
    "minPurchaseValue" DOUBLE PRECISION,
    "freeShippingValue" DOUBLE PRECISION,
    "maxOrdersPerUser" INTEGER,
    "appliesToAllProducts" BOOLEAN DEFAULT true,
    "selectedProductIds" TEXT[],
    "capMinValue" DOUBLE PRECISION,
    "capMaxValue" DOUBLE PRECISION,
    "eligibleCustomers" "EligibleCustomerType" NOT NULL,
    "customerTypes" "CustomerType"[],
    "highSpendLimit" DOUBLE PRECISION,
    "eligibleCountries" TEXT[],
    "eligibleStates" TEXT[],
    "eligibleCities" TEXT[],
    "deliveryOptions" "DeliveryOption"[],
    "durationType" "DurationType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "buyQuantity" INTEGER,
    "buyProductIds" TEXT[],
    "getQuantity" INTEGER,
    "getProductIds" TEXT[],
    "spendAmount" DOUBLE PRECISION,
    "spendFixedDiscount" DOUBLE PRECISION,
    "spendPercentageDiscount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleDeal" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "bundleQuantity" INTEGER NOT NULL,
    "bundlePercentageDiscount" DOUBLE PRECISION,
    "bundleFixedDiscount" DOUBLE PRECISION,

    CONSTRAINT "BundleDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "barCode" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" INTEGER,
    "discountedPrice" DOUBLE PRECISION,
    "endingDate" TIMESTAMP(3),
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantAttribute" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "VariantAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT,
    "zipCode" TEXT NOT NULL,
    "userId" TEXT,
    "building" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extension" TEXT,
    "isDefault" BOOLEAN DEFAULT false,
    "officeName" TEXT,
    "phone" TEXT,
    "streetAddress" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPER_ADMIN',
    "password" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "profile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "password" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "profile" TEXT,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL,
    "management" TEXT NOT NULL,
    "view" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "add" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendors" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "adminId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isApproved" BOOLEAN DEFAULT false,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VENDOR',
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "autherizeDist" BOOLEAN DEFAULT false,
    "businessType" "VendorBusinessType",
    "defaultUps" BOOLEAN DEFAULT false,
    "delieryId" TEXT,
    "ownProductManf" BOOLEAN DEFAULT false,
    "webisteName" TEXT,
    "websiteUrl" TEXT,
    "workPhone" TEXT,
    "status" "vendorStatus" NOT NULL DEFAULT 'PENDING',
    "dateOfBirth" TEXT,
    "reason" TEXT,
    "returnPolicy" BOOLEAN DEFAULT false,
    "profile" TEXT,
    "lastSeen" TIMESTAMP(3),
    "link" TEXT,
    "lastStatusNotifyAt" TIMESTAMP(3),

    CONSTRAINT "Vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "commissionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "payOnStatus" "PayStatus" NOT NULL DEFAULT 'DELIVERED',
    "calculationMethod" "CommissionType" NOT NULL DEFAULT 'WHOLE_ORDER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorTransfers" (
    "id" TEXT NOT NULL,
    "transferId" TEXT,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "saleItemPrice" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "shippingCost" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "transactionType" "TransactionType" NOT NULL DEFAULT 'SALE',
    "vendorSalePriceAfterCommission" DOUBLE PRECISION NOT NULL,
    "vendorTax" DOUBLE PRECISION NOT NULL,
    "vendorShipping" DOUBLE PRECISION NOT NULL,
    "vendorTotal" DOUBLE PRECISION NOT NULL,
    "platformCommission" DOUBLE PRECISION NOT NULL,
    "platformTax" DOUBLE PRECISION NOT NULL,
    "platformShipping" DOUBLE PRECISION NOT NULL,
    "platformStripeFee" DOUBLE PRECISION NOT NULL,
    "platformTotal" DOUBLE PRECISION NOT NULL,
    "shipment" TEXT NOT NULL,
    "pendingAmount" DOUBLE PRECISION,
    "status" "VendorTransfersStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorTransfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDebts" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDebts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorUPS" (
    "id" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "email" TEXT,
    "serviceName" TEXT,
    "websiteUrl" TEXT,
    "phoneNo" TEXT,
    "vendorId" TEXT,
    "accessToken" TEXT,

    CONSTRAINT "VendorUPS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectAccount" (
    "id" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "businessName" TEXT,
    "websiteURL" TEXT,
    "email" TEXT NOT NULL,
    "MCC" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "SNN" TEXT,
    "ENN" TEXT,
    "streetAddress" TEXT,
    "building" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "routingNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "connectAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "password" TEXT NOT NULL,
    "businessType" "BussinessType" NOT NULL,
    "healthCareBusinessType" "HealthCareBusinessType",
    "dentalOfficeSpeciality" "Speciality"[] DEFAULT ARRAY[]::"Speciality"[],
    "noOfLocations" INTEGER,
    "doctorFirstName" TEXT,
    "doctorLastName" TEXT,
    "officeContactFirstName" TEXT,
    "officeContactLastName" TEXT,
    "contactJobTitle" TEXT,
    "managerFirstName" TEXT,
    "managerLastName" TEXT,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isVerfied" BOOLEAN NOT NULL DEFAULT false,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "officePhoneNo" TEXT,
    "stripeCustomerId" TEXT,
    "profile" TEXT,
    "lastSeen" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseList" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "isDefault" BOOLEAN DEFAULT false,
    "state" TEXT,

    CONSTRAINT "LicenseList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "vendorId" TEXT,
    "adminId" TEXT,
    "superAdminId" TEXT,
    "orderId" TEXT,
    "productId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "chatId" TEXT,
    "isMessage" BOOLEAN NOT NULL DEFAULT false,
    "isOrder" BOOLEAN NOT NULL DEFAULT false,
    "isProduct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "wishlistId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("wishlistId","variantId")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addressId" TEXT,
    "cardNumber" TEXT,
    "discount" TEXT,
    "expiryDate" TEXT,
    "isCanceled" BOOLEAN,
    "licenseId" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" DEFAULT 'PLACED',
    "stripePaymentIntentId" TEXT,
    "tax" DOUBLE PRECISION,
    "trackingNo" JSONB,
    "deliveryOptions" JSONB,
    "shippingTax" DOUBLE PRECISION,
    "autoOrderId" TEXT,
    "userSnapshot" JSONB NOT NULL DEFAULT '{}',
    "billingDetails" JSONB NOT NULL DEFAULT '[]',
    "promotionIds" TEXT[],
    "promotionDiscount" JSONB,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItems" (
    "orderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "variantId" TEXT NOT NULL,
    "isFree" BOOLEAN DEFAULT false,
    "freeQuantity" INTEGER DEFAULT 0,
    "vendorId" TEXT NOT NULL,
    "trackingNo" TEXT,
    "trackStatus" JSONB NOT NULL DEFAULT '[]',
    "productSnapshot" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "OrderItems_pkey" PRIMARY KEY ("orderId","variantId")
);

-- CreateTable
CREATE TABLE "OrderPromotion" (
    "orderId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,

    CONSTRAINT "OrderPromotion_pkey" PRIMARY KEY ("orderId","promotionId")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "subtotalAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "taxRateApplied" DOUBLE PRECISION,
    "stateCollectedFor" TEXT,
    "status" "TransactionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippingCost" DOUBLE PRECISION,
    "orderId" TEXT NOT NULL,
    "refundAmount" DOUBLE PRECISION,
    "refundReason" TEXT,
    "capturedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "autoOrderFrequency" TEXT NOT NULL,
    "autoOrderFrequencyTime" DOUBLE PRECISION NOT NULL,
    "startDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentMethodId" TEXT,

    CONSTRAINT "AutoOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoOrderItems" (
    "id" TEXT NOT NULL,
    "autoOrderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "AutoOrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnStatus" "OrderRemarks",
    "trackingNo" TEXT NOT NULL,
    "deliverFrom" TEXT NOT NULL,

    CONSTRAINT "ReturnOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnOrderVariant" (
    "returnOrderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "ReturnOrderVariant_pkey" PRIMARY KEY ("returnOrderId","variantId")
);

-- CreateTable
CREATE TABLE "CancelOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "cancelStatus" "CancelOrderStatus",

    CONSTRAINT "CancelOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelOrderVariant" (
    "cancelOrderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "CancelOrderVariant_pkey" PRIMARY KEY ("cancelOrderId","variantId")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "cartId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("cartId","variantId")
);

-- CreateTable
CREATE TABLE "GetInTouch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GetInTouch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "thumbnailUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "vendorId" TEXT,
    "adminId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImsUser" (
    "client_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "contact_number" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "ims_role" TEXT,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "permanent_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "agree_to_terms" BOOLEAN NOT NULL,
    "stripe_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImsUser_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "ImsUserDetail" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "demo_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "admin_id" INTEGER,

    CONSTRAINT "ImsUserDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "license_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "license_type" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("license_id")
);

-- CreateTable
CREATE TABLE "Shipping" (
    "shipping_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "office_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "phone" TEXT,
    "extension" TEXT,

    CONSTRAINT "Shipping_pkey" PRIMARY KEY ("shipping_id")
);

-- CreateTable
CREATE TABLE "Billing" (
    "billing_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_payment_method_id" TEXT,
    "card_brand" TEXT,
    "encrypted_masked_card" TEXT,
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "billing_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("billing_id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "agreement_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "agreement_file" TEXT NOT NULL,
    "admin_id" INTEGER,
    "dentistry_account_linked" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("agreement_id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "subscription_plan_id" UUID NOT NULL,
    "plan_name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("subscription_plan_id")
);

-- CreateTable
CREATE TABLE "ClientSubscription" (
    "client_id" UUID NOT NULL,
    "subscription_plan_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "final_amount" DOUBLE PRECISION NOT NULL,
    "payment_status" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "ClientSubscription_pkey" PRIMARY KEY ("client_id","subscription_plan_id","start_date")
);

-- CreateTable
CREATE TABLE "Office" (
    "office_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "office_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("office_id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "staff_id" UUID NOT NULL,
    "client_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "designation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "officeOffice_id" UUID,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "purchase_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "is_quotation" BOOLEAN NOT NULL DEFAULT true,
    "quotation_number" TEXT,
    "purchase_date" TIMESTAMP(3),
    "quotation_date" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderDetail" (
    "purchase_id" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "PurchaseOrderDetail_pkey" PRIMARY KEY ("purchase_id","productId")
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "purchase_return_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY ("purchase_return_id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnDetail" (
    "purchase_return_id" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseReturnDetail_pkey" PRIMARY KEY ("purchase_return_id","productId")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" UUID NOT NULL,
    "transaction_type" "IMSTransactionType" NOT NULL,
    "staff_id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "brand" TEXT,
    "quantity" INTEGER NOT NULL,
    "batch_no" TEXT,
    "expiry_date" TIMESTAMP(3),
    "unit_price" DOUBLE PRECISION NOT NULL,
    "room_number" TEXT,
    "purpose" TEXT,
    "status" "IMSStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "source_office_id" UUID NOT NULL,
    "destination_office_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferDetail" (
    "transfer_id" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "TransferDetail_pkey" PRIMARY KEY ("transfer_id","productId")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "quotation_id" UUID NOT NULL,
    "client_id" UUID,
    "product_name" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "budget" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("quotation_id")
);

-- CreateTable
CREATE TABLE "SystemActivity" (
    "activity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "product" TEXT,
    "office" TEXT,
    "user" TEXT,
    "client_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemActivity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "ims_roles" (
    "role_id" UUID NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ims_roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "ims_permissions" (
    "permission_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ims_permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "ims_role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "ims_role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "ims_staff_roles" (
    "staff_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "ims_staff_roles_pkey" PRIMARY KEY ("staff_id","role_id")
);

-- CreateTable
CREATE TABLE "ims_user_roles" (
    "client_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ims_user_roles_pkey" PRIMARY KEY ("client_id","role_id")
);

-- CreateTable
CREATE TABLE "ims_audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "client_id" UUID,
    "action_type" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "record_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ims_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PromotionProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Reply_userId_key" ON "Reply"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reply_reviewId_key" ON "Reply"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_type_name_key" ON "Inventory_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Address_vendorId_key" ON "Address"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyContact_adminId_key" ON "EmergencyContact"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendors_email_key" ON "Vendors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_vendorId_key" ON "Commission"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorTransfers_vendorId_orderId_key" ON "VendorTransfers"("vendorId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorDebts_vendorId_orderId_key" ON "VendorDebts"("vendorId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "connectAccount_vendorId_key" ON "connectAccount"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WishList_userId_key" ON "WishList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Orders_orderNumber_key" ON "Orders"("orderNumber");

-- CreateIndex
CREATE INDEX "Transaction_customerId_idx" ON "Transaction"("customerId");

-- CreateIndex
CREATE INDEX "Transaction_vendorId_idx" ON "Transaction"("vendorId");

-- CreateIndex
CREATE INDEX "Transaction_stripePaymentIntentId_idx" ON "Transaction"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnOrder_orderId_key" ON "ReturnOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CancelOrder_orderId_key" ON "CancelOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ImsUser_email_key" ON "ImsUser"("email");

-- CreateIndex
CREATE INDEX "ImsUserDetail_client_id_idx" ON "ImsUserDetail"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "Office_client_id_office_name_key" ON "Office"("client_id", "office_name");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE INDEX "SystemActivity_created_at_idx" ON "SystemActivity"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ims_roles_role_name_key" ON "ims_roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "ims_permissions_name_key" ON "ims_permissions"("name");

-- CreateIndex
CREATE INDEX "ims_user_roles_role_id_idx" ON "ims_user_roles"("role_id");

-- CreateIndex
CREATE INDEX "ims_audit_logs_client_id_idx" ON "ims_audit_logs"("client_id");

-- CreateIndex
CREATE INDEX "ims_audit_logs_model_name_idx" ON "ims_audit_logs"("model_name");

-- CreateIndex
CREATE INDEX "ims_audit_logs_timestamp_idx" ON "ims_audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "_PromotionProducts_AB_unique" ON "_PromotionProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_PromotionProducts_B_index" ON "_PromotionProducts"("B");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answers" ADD CONSTRAINT "Answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answers" ADD CONSTRAINT "Answers_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_inventoryTypeId_fkey" FOREIGN KEY ("inventoryTypeId") REFERENCES "Inventory_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleDeal" ADD CONSTRAINT "BundleDeal_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAttribute" ADD CONSTRAINT "VariantAttribute_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRole" ADD CONSTRAINT "AdminRole_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorTransfers" ADD CONSTRAINT "VendorTransfers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorTransfers" ADD CONSTRAINT "VendorTransfers_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDebts" ADD CONSTRAINT "VendorDebts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDebts" ADD CONSTRAINT "VendorDebts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorUPS" ADD CONSTRAINT "VendorUPS_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectAccount" ADD CONSTRAINT "connectAccount_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseList" ADD CONSTRAINT "LicenseList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishList" ADD CONSTRAINT "WishList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "WishList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_autoOrderId_fkey" FOREIGN KEY ("autoOrderId") REFERENCES "AutoOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "LicenseList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPromotion" ADD CONSTRAINT "OrderPromotion_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPromotion" ADD CONSTRAINT "OrderPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoOrder" ADD CONSTRAINT "AutoOrder_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoOrder" ADD CONSTRAINT "AutoOrder_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "LicenseList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoOrder" ADD CONSTRAINT "AutoOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoOrder" ADD CONSTRAINT "AutoOrder_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoOrderItems" ADD CONSTRAINT "AutoOrderItems_autoOrderId_fkey" FOREIGN KEY ("autoOrderId") REFERENCES "AutoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnOrder" ADD CONSTRAINT "ReturnOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnOrderVariant" ADD CONSTRAINT "ReturnOrderVariant_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnOrderVariant" ADD CONSTRAINT "ReturnOrderVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelOrder" ADD CONSTRAINT "CancelOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelOrderVariant" ADD CONSTRAINT "CancelOrderVariant_cancelOrderId_fkey" FOREIGN KEY ("cancelOrderId") REFERENCES "CancelOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelOrderVariant" ADD CONSTRAINT "CancelOrderVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GetInTouch" ADD CONSTRAINT "GetInTouch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImsUserDetail" ADD CONSTRAINT "ImsUserDetail_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipping" ADD CONSTRAINT "Shipping_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSubscription" ADD CONSTRAINT "ClientSubscription_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSubscription" ADD CONSTRAINT "ClientSubscription_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "SubscriptionPlan"("subscription_plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_officeOffice_id_fkey" FOREIGN KEY ("officeOffice_id") REFERENCES "Office"("office_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "PurchaseOrder"("purchase_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "PurchaseOrder"("purchase_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnDetail" ADD CONSTRAINT "PurchaseReturnDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnDetail" ADD CONSTRAINT "PurchaseReturnDetail_purchase_return_id_fkey" FOREIGN KEY ("purchase_return_id") REFERENCES "PurchaseReturn"("purchase_return_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "Office"("office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_source_office_id_fkey" FOREIGN KEY ("source_office_id") REFERENCES "Office"("office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_destination_office_id_fkey" FOREIGN KEY ("destination_office_id") REFERENCES "Office"("office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDetail" ADD CONSTRAINT "TransferDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDetail" ADD CONSTRAINT "TransferDetail_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ims_role_permissions" ADD CONSTRAINT "ims_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ims_roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ims_role_permissions" ADD CONSTRAINT "ims_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "ims_permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ims_staff_roles" ADD CONSTRAINT "ims_staff_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ims_roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ims_user_roles" ADD CONSTRAINT "ims_user_roles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ims_user_roles" ADD CONSTRAINT "ims_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ims_roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ims_audit_logs" ADD CONSTRAINT "ims_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ImsUser"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

