
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.16.2
 * Query Engine version: 34ace0eb2704183d2c05b60b52fba5c43c13f303
 */
Prisma.prismaVersion = {
  client: "5.16.2",
  engine: "34ace0eb2704183d2c05b60b52fba5c43c13f303"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  image: 'image',
  slug: 'slug',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  approved: 'approved'
};

exports.Prisma.ReplyScalarFieldEnum = {
  id: 'id',
  reply: 'reply',
  userId: 'userId',
  reviewId: 'reviewId'
};

exports.Prisma.ReviewsScalarFieldEnum = {
  id: 'id',
  review: 'review',
  rating: 'rating',
  userId: 'userId',
  productId: 'productId',
  images: 'images',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  sellerRating: 'sellerRating'
};

exports.Prisma.MaterialScalarFieldEnum = {
  id: 'id',
  name: 'name',
  images: 'images'
};

exports.Prisma.QuestionsScalarFieldEnum = {
  id: 'id',
  question: 'question',
  userId: 'userId',
  productId: 'productId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AnswersScalarFieldEnum = {
  id: 'id',
  reply: 'reply',
  vendorId: 'vendorId',
  questionId: 'questionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  title: 'title',
  descriptiveTitle: 'descriptiveTitle',
  totalSold: 'totalSold',
  totalReviews: 'totalReviews',
  images: 'images',
  description: 'description',
  approved: 'approved',
  totalSales: 'totalSales',
  quantity: 'quantity',
  featured: 'featured',
  manufacturer: 'manufacturer',
  packaging: 'packaging',
  materialId: 'materialId',
  type: 'type',
  vasoconstrictor: 'vasoconstrictor',
  sds: 'sds',
  style: 'style',
  sterility: 'sterility',
  properties: 'properties',
  construction: 'construction',
  dilutionRatio: 'dilutionRatio',
  vendorId: 'vendorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  disapprovalMsg: 'disapprovalMsg',
  height: 'height',
  intoWishList: 'intoWishList',
  length: 'length',
  rating: 'rating',
  video: 'video',
  weight: 'weight',
  width: 'width',
  status: 'status',
  bannerImage: 'bannerImage',
  reason: 'reason',
  scent: 'scent',
  viscosity: 'viscosity',
  fluidResistance: 'fluidResistance',
  filtrationRate: 'filtrationRate',
  brand: 'brand',
  isLicenseRequired: 'isLicenseRequired',
  deliveryOptions: 'deliveryOptions',
  isActive: 'isActive',
  shippingMethod: 'shippingMethod',
  flatRate: 'flatRate'
};

exports.Prisma.ProductCategoryScalarFieldEnum = {
  productId: 'productId',
  categoryId: 'categoryId'
};

exports.Prisma.PromotionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  type: 'type',
  minPurchaseValue: 'minPurchaseValue',
  freeShippingValue: 'freeShippingValue',
  maxOrdersPerUser: 'maxOrdersPerUser',
  appliesToAllProducts: 'appliesToAllProducts',
  selectedProductIds: 'selectedProductIds',
  capMinValue: 'capMinValue',
  capMaxValue: 'capMaxValue',
  eligibleCustomers: 'eligibleCustomers',
  customerTypes: 'customerTypes',
  highSpendLimit: 'highSpendLimit',
  eligibleCountries: 'eligibleCountries',
  eligibleStates: 'eligibleStates',
  eligibleCities: 'eligibleCities',
  deliveryOptions: 'deliveryOptions',
  durationType: 'durationType',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  buyQuantity: 'buyQuantity',
  buyProductIds: 'buyProductIds',
  getQuantity: 'getQuantity',
  getProductIds: 'getProductIds',
  spendAmount: 'spendAmount',
  spendFixedDiscount: 'spendFixedDiscount',
  spendPercentageDiscount: 'spendPercentageDiscount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  vendorId: 'vendorId'
};

exports.Prisma.BundleDealScalarFieldEnum = {
  id: 'id',
  promotionId: 'promotionId',
  bundleQuantity: 'bundleQuantity',
  bundlePercentageDiscount: 'bundlePercentageDiscount',
  bundleFixedDiscount: 'bundleFixedDiscount'
};

exports.Prisma.ProductVariantScalarFieldEnum = {
  id: 'id',
  color: 'color',
  size: 'size',
  images: 'images',
  quantity: 'quantity',
  sku: 'sku',
  barCode: 'barCode',
  price: 'price',
  discount: 'discount',
  discountedPrice: 'discountedPrice',
  endingDate: 'endingDate',
  productId: 'productId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VariantAttributeScalarFieldEnum = {
  id: 'id',
  variantId: 'variantId',
  name: 'name',
  value: 'value'
};

exports.Prisma.AddressScalarFieldEnum = {
  id: 'id',
  city: 'city',
  state: 'state',
  country: 'country',
  zipCode: 'zipCode',
  userId: 'userId',
  building: 'building',
  createdAt: 'createdAt',
  extension: 'extension',
  isDefault: 'isDefault',
  officeName: 'officeName',
  phone: 'phone',
  streetAddress: 'streetAddress',
  updatedAt: 'updatedAt',
  vendorId: 'vendorId'
};

exports.Prisma.SuperAdminScalarFieldEnum = {
  id: 'id',
  email: 'email',
  phone: 'phone',
  firstName: 'firstName',
  lastName: 'lastName',
  role: 'role',
  password: 'password',
  resetToken: 'resetToken',
  resetTokenExp: 'resetTokenExp',
  profile: 'profile',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AdminScalarFieldEnum = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  role: 'role',
  password: 'password',
  resetToken: 'resetToken',
  resetTokenExp: 'resetTokenExp',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  address: 'address',
  dateOfBirth: 'dateOfBirth',
  status: 'status',
  reason: 'reason',
  profile: 'profile'
};

exports.Prisma.EmergencyContactScalarFieldEnum = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  contactNo: 'contactNo',
  relation: 'relation',
  adminId: 'adminId'
};

exports.Prisma.AdminRoleScalarFieldEnum = {
  id: 'id',
  management: 'management',
  view: 'view',
  edit: 'edit',
  add: 'add',
  delete: 'delete',
  adminId: 'adminId'
};

exports.Prisma.VendorsScalarFieldEnum = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  adminId: 'adminId',
  email: 'email',
  phone: 'phone',
  isApproved: 'isApproved',
  password: 'password',
  role: 'role',
  resetToken: 'resetToken',
  resetTokenExp: 'resetTokenExp',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  autherizeDist: 'autherizeDist',
  businessType: 'businessType',
  defaultUps: 'defaultUps',
  delieryId: 'delieryId',
  ownProductManf: 'ownProductManf',
  webisteName: 'webisteName',
  websiteUrl: 'websiteUrl',
  workPhone: 'workPhone',
  status: 'status',
  dateOfBirth: 'dateOfBirth',
  reason: 'reason',
  returnPolicy: 'returnPolicy',
  profile: 'profile',
  lastSeen: 'lastSeen',
  link: 'link',
  lastStatusNotifyAt: 'lastStatusNotifyAt'
};

exports.Prisma.CommissionScalarFieldEnum = {
  id: 'id',
  vendorId: 'vendorId',
  commissionPercentage: 'commissionPercentage',
  payOnStatus: 'payOnStatus',
  calculationMethod: 'calculationMethod',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorTransfersScalarFieldEnum = {
  id: 'id',
  transferId: 'transferId',
  orderId: 'orderId',
  vendorId: 'vendorId',
  saleItemPrice: 'saleItemPrice',
  tax: 'tax',
  shippingCost: 'shippingCost',
  total: 'total',
  transactionType: 'transactionType',
  vendorSalePriceAfterCommission: 'vendorSalePriceAfterCommission',
  vendorTax: 'vendorTax',
  vendorShipping: 'vendorShipping',
  vendorTotal: 'vendorTotal',
  platformCommission: 'platformCommission',
  platformTax: 'platformTax',
  platformShipping: 'platformShipping',
  platformStripeFee: 'platformStripeFee',
  platformTotal: 'platformTotal',
  shipment: 'shipment',
  pendingAmount: 'pendingAmount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorDebtsScalarFieldEnum = {
  id: 'id',
  vendorId: 'vendorId',
  orderId: 'orderId',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorUPSScalarFieldEnum = {
  id: 'id',
  accountNo: 'accountNo',
  email: 'email',
  serviceName: 'serviceName',
  websiteUrl: 'websiteUrl',
  phoneNo: 'phoneNo',
  vendorId: 'vendorId',
  accessToken: 'accessToken'
};

exports.Prisma.ConnectAccountScalarFieldEnum = {
  id: 'id',
  businessType: 'businessType',
  country: 'country',
  businessName: 'businessName',
  websiteURL: 'websiteURL',
  email: 'email',
  MCC: 'MCC',
  phone: 'phone',
  firstName: 'firstName',
  lastName: 'lastName',
  dateOfBirth: 'dateOfBirth',
  SNN: 'SNN',
  ENN: 'ENN',
  streetAddress: 'streetAddress',
  building: 'building',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  accountHolderName: 'accountHolderName',
  accountNumber: 'accountNumber',
  routingNumber: 'routingNumber',
  vendorId: 'vendorId'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  firstName: 'firstName',
  lastName: 'lastName',
  password: 'password',
  businessType: 'businessType',
  healthCareBusinessType: 'healthCareBusinessType',
  dentalOfficeSpeciality: 'dentalOfficeSpeciality',
  noOfLocations: 'noOfLocations',
  doctorFirstName: 'doctorFirstName',
  doctorLastName: 'doctorLastName',
  officeContactFirstName: 'officeContactFirstName',
  officeContactLastName: 'officeContactLastName',
  contactJobTitle: 'contactJobTitle',
  managerFirstName: 'managerFirstName',
  managerLastName: 'managerLastName',
  resetToken: 'resetToken',
  resetTokenExp: 'resetTokenExp',
  role: 'role',
  isVerfied: 'isVerfied',
  isSubscribed: 'isSubscribed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  officePhoneNo: 'officePhoneNo',
  stripeCustomerId: 'stripeCustomerId',
  profile: 'profile',
  lastSeen: 'lastSeen'
};

exports.Prisma.ChatScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  vendorId: 'vendorId',
  createdAt: 'createdAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  chatId: 'chatId',
  senderId: 'senderId',
  text: 'text',
  isRead: 'isRead',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.LicenseListScalarFieldEnum = {
  id: 'id',
  licenseNumber: 'licenseNumber',
  licenseType: 'licenseType',
  expirationDate: 'expirationDate',
  userId: 'userId',
  isDefault: 'isDefault',
  state: 'state'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  title: 'title',
  message: 'message',
  userId: 'userId',
  vendorId: 'vendorId',
  adminId: 'adminId',
  superAdminId: 'superAdminId',
  orderId: 'orderId',
  productId: 'productId',
  isRead: 'isRead',
  chatId: 'chatId',
  isMessage: 'isMessage',
  isOrder: 'isOrder',
  isProduct: 'isProduct',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WishListScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WishlistItemScalarFieldEnum = {
  wishlistId: 'wishlistId',
  quantity: 'quantity',
  variantId: 'variantId'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrdersScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  addressId: 'addressId',
  cardNumber: 'cardNumber',
  discount: 'discount',
  expiryDate: 'expiryDate',
  isCanceled: 'isCanceled',
  licenseId: 'licenseId',
  price: 'price',
  status: 'status',
  stripePaymentIntentId: 'stripePaymentIntentId',
  tax: 'tax',
  trackingNo: 'trackingNo',
  deliveryOptions: 'deliveryOptions',
  shippingTax: 'shippingTax',
  autoOrderId: 'autoOrderId',
  userSnapshot: 'userSnapshot',
  billingDetails: 'billingDetails',
  promotionIds: 'promotionIds',
  promotionDiscount: 'promotionDiscount'
};

exports.Prisma.OrderItemsScalarFieldEnum = {
  orderId: 'orderId',
  quantity: 'quantity',
  status: 'status',
  variantId: 'variantId',
  isFree: 'isFree',
  freeQuantity: 'freeQuantity',
  vendorId: 'vendorId',
  trackingNo: 'trackingNo',
  trackStatus: 'trackStatus',
  productSnapshot: 'productSnapshot'
};

exports.Prisma.OrderPromotionScalarFieldEnum = {
  orderId: 'orderId',
  promotionId: 'promotionId'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  stripePaymentIntentId: 'stripePaymentIntentId',
  customerId: 'customerId',
  vendorId: 'vendorId',
  subtotalAmount: 'subtotalAmount',
  taxAmount: 'taxAmount',
  totalAmount: 'totalAmount',
  currency: 'currency',
  taxRateApplied: 'taxRateApplied',
  stateCollectedFor: 'stateCollectedFor',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  shippingCost: 'shippingCost',
  orderId: 'orderId',
  refundAmount: 'refundAmount',
  refundReason: 'refundReason',
  capturedAt: 'capturedAt',
  refundedAt: 'refundedAt',
  metadata: 'metadata'
};

exports.Prisma.AutoOrderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  addressId: 'addressId',
  licenseId: 'licenseId',
  variantId: 'variantId',
  autoOrderFrequency: 'autoOrderFrequency',
  autoOrderFrequencyTime: 'autoOrderFrequencyTime',
  startDate: 'startDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  paymentMethodId: 'paymentMethodId'
};

exports.Prisma.AutoOrderItemsScalarFieldEnum = {
  id: 'id',
  autoOrderId: 'autoOrderId',
  quantity: 'quantity'
};

exports.Prisma.ReturnOrderScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  returnStatus: 'returnStatus',
  trackingNo: 'trackingNo',
  deliverFrom: 'deliverFrom'
};

exports.Prisma.ReturnOrderVariantScalarFieldEnum = {
  returnOrderId: 'returnOrderId',
  message: 'message',
  reason: 'reason',
  variantId: 'variantId'
};

exports.Prisma.CancelOrderScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  message: 'message',
  reason: 'reason',
  cancelStatus: 'cancelStatus'
};

exports.Prisma.CancelOrderVariantScalarFieldEnum = {
  cancelOrderId: 'cancelOrderId',
  variantId: 'variantId'
};

exports.Prisma.CartItemScalarFieldEnum = {
  cartId: 'cartId',
  quantity: 'quantity',
  variantId: 'variantId'
};

exports.Prisma.GetInTouchScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  subject: 'subject',
  message: 'message',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BlogCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BlogTagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  createdAt: 'createdAt'
};

exports.Prisma.BlogPostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  content: 'content',
  excerpt: 'excerpt',
  thumbnailUrl: 'thumbnailUrl',
  published: 'published',
  publishedAt: 'publishedAt',
  seoTitle: 'seoTitle',
  seoDescription: 'seoDescription',
  vendorId: 'vendorId',
  adminId: 'adminId',
  categoryId: 'categoryId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BlogPostTagScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  tagId: 'tagId'
};

exports.Prisma.ImsUserScalarFieldEnum = {
  client_id: 'client_id',
  company_name: 'company_name',
  first_name: 'first_name',
  last_name: 'last_name',
  contact_number: 'contact_number',
  email: 'email',
  permanent_address: 'permanent_address',
  city: 'city',
  state: 'state',
  zip_code: 'zip_code',
  agree_to_terms: 'agree_to_terms',
  stripe_customer_id: 'stripe_customer_id',
  created_at: 'created_at'
};

exports.Prisma.ImsUserDetailScalarFieldEnum = {
  id: 'id',
  client_id: 'client_id',
  demo_date: 'demo_date',
  status: 'status',
  remarks: 'remarks',
  admin_id: 'admin_id'
};

exports.Prisma.LicenseScalarFieldEnum = {
  license_id: 'license_id',
  client_id: 'client_id',
  license_type: 'license_type',
  license_number: 'license_number',
  expiry_date: 'expiry_date',
  state: 'state',
  status: 'status'
};

exports.Prisma.ShippingScalarFieldEnum = {
  shipping_id: 'shipping_id',
  client_id: 'client_id',
  office_name: 'office_name',
  address: 'address',
  city: 'city',
  state: 'state',
  zip_code: 'zip_code',
  phone: 'phone',
  extension: 'extension'
};

exports.Prisma.BillingScalarFieldEnum = {
  billing_id: 'billing_id',
  client_id: 'client_id',
  stripe_customer_id: 'stripe_customer_id',
  stripe_payment_method_id: 'stripe_payment_method_id',
  card_brand: 'card_brand',
  last4: 'last4',
  expiry_month: 'expiry_month',
  expiry_year: 'expiry_year',
  billing_address: 'billing_address',
  created_at: 'created_at'
};

exports.Prisma.AgreementScalarFieldEnum = {
  agreement_id: 'agreement_id',
  client_id: 'client_id',
  agreement_file: 'agreement_file',
  admin_id: 'admin_id',
  dentistry_account_linked: 'dentistry_account_linked',
  status: 'status',
  remarks: 'remarks',
  created_by: 'created_by',
  updated_at: 'updated_at'
};

exports.Prisma.SubscriptionPlanScalarFieldEnum = {
  subscription_plan_id: 'subscription_plan_id',
  plan_name: 'plan_name',
  price: 'price',
  duration: 'duration',
  description: 'description',
  created_at: 'created_at'
};

exports.Prisma.ClientSubscriptionScalarFieldEnum = {
  client_id: 'client_id',
  subscription_plan_id: 'subscription_plan_id',
  start_date: 'start_date',
  end_date: 'end_date',
  final_amount: 'final_amount',
  payment_status: 'payment_status',
  active: 'active'
};

exports.Prisma.OfficeScalarFieldEnum = {
  office_id: 'office_id',
  client_id: 'client_id',
  office_name: 'office_name',
  address: 'address',
  created_at: 'created_at'
};

exports.Prisma.StaffScalarFieldEnum = {
  staff_id: 'staff_id',
  client_id: 'client_id',
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  designation: 'designation',
  created_at: 'created_at',
  updated_at: 'updated_at',
  officeOffice_id: 'officeOffice_id'
};

exports.Prisma.PurchaseOrderScalarFieldEnum = {
  purchase_id: 'purchase_id',
  client_id: 'client_id',
  quotation_number: 'quotation_number',
  quotation_date: 'quotation_date',
  valid_until: 'valid_until',
  status: 'status',
  remarks: 'remarks'
};

exports.Prisma.PurchaseOrderDetailScalarFieldEnum = {
  purchase_id: 'purchase_id',
  productId: 'productId',
  quantity: 'quantity',
  unit_price: 'unit_price'
};

exports.Prisma.PurchaseReturnScalarFieldEnum = {
  purchase_return_id: 'purchase_return_id',
  quotation_id: 'quotation_id',
  return_date: 'return_date'
};

exports.Prisma.PurchaseReturnDetailScalarFieldEnum = {
  purchase_return_id: 'purchase_return_id',
  productId: 'productId',
  quantity: 'quantity',
  unit_price: 'unit_price'
};

exports.Prisma.InventoryScalarFieldEnum = {
  id: 'id',
  transaction_type: 'transaction_type',
  staff_id: 'staff_id',
  office_id: 'office_id',
  productId: 'productId',
  brand: 'brand',
  quantity: 'quantity',
  batch_no: 'batch_no',
  expiry_date: 'expiry_date',
  unit_price: 'unit_price',
  room_number: 'room_number',
  purpose: 'purpose',
  status: 'status',
  created_at: 'created_at'
};

exports.Prisma.TransferScalarFieldEnum = {
  id: 'id',
  client_id: 'client_id',
  source_office_id: 'source_office_id',
  destination_office_id: 'destination_office_id',
  status: 'status',
  transfer_date: 'transfer_date',
  created_at: 'created_at'
};

exports.Prisma.TransferDetailScalarFieldEnum = {
  transfer_id: 'transfer_id',
  productId: 'productId',
  qty: 'qty'
};

exports.Prisma.QuotationScalarFieldEnum = {
  quotation_id: 'quotation_id',
  client_id: 'client_id',
  product_name: 'product_name',
  product_type: 'product_type',
  quantity: 'quantity',
  budget: 'budget',
  description: 'description',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.productStatus = exports.$Enums.productStatus = {
  PENDING: 'PENDING',
  REJECT: 'REJECT',
  APPROVE: 'APPROVE'
};

exports.ShippingMethod = exports.$Enums.ShippingMethod = {
  FLAT: 'FLAT',
  UPS: 'UPS'
};

exports.PromotionType = exports.$Enums.PromotionType = {
  FREE_SHIPPING: 'FREE_SHIPPING',
  BUY_X_GET_Y: 'BUY_X_GET_Y',
  BUNDLE_DEALS: 'BUNDLE_DEALS',
  SPEND_MONEY: 'SPEND_MONEY'
};

exports.EligibleCustomerType = exports.$Enums.EligibleCustomerType = {
  ALL: 'ALL',
  ADD_CUSTOMER: 'ADD_CUSTOMER'
};

exports.DurationType = exports.$Enums.DurationType = {
  LONG_TIME: 'LONG_TIME',
  SELECTED_TIME: 'SELECTED_TIME'
};

exports.CustomerType = exports.$Enums.CustomerType = {
  NEW: 'NEW',
  REPEATED: 'REPEATED',
  HIGH_SPEND: 'HIGH_SPEND',
  NEWS_LETTER: 'NEWS_LETTER'
};

exports.DeliveryOption = exports.$Enums.DeliveryOption = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  LUXURY: 'LUXURY',
  EXPRESS: 'EXPRESS'
};

exports.Role = exports.$Enums.Role = {
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  USER: 'USER'
};

exports.Status = exports.$Enums.Status = {
  ACTIVE: 'ACTIVE',
  IN_ACTIVE: 'IN_ACTIVE'
};

exports.VendorBusinessType = exports.$Enums.VendorBusinessType = {
  INDIVIDUAL_PROFILE: 'INDIVIDUAL_PROFILE',
  BUSINESS_PROFILE: 'BUSINESS_PROFILE'
};

exports.vendorStatus = exports.$Enums.vendorStatus = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  BLOCK: 'BLOCK',
  RESUBMIT: 'RESUBMIT',
  PENDING: 'PENDING'
};

exports.PayStatus = exports.$Enums.PayStatus = {
  PLACED: 'PLACED',
  INPROGRESS: 'INPROGRESS',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED'
};

exports.CommissionType = exports.$Enums.CommissionType = {
  SOLD_ITEM: 'SOLD_ITEM',
  WHOLE_ORDER: 'WHOLE_ORDER'
};

exports.TransactionType = exports.$Enums.TransactionType = {
  SALE: 'SALE',
  RETURNED: 'RETURNED',
  REFUND: 'REFUND',
  REFUND_PENDING: 'REFUND_PENDING',
  RETURN_PENDING: 'RETURN_PENDING'
};

exports.VendorTransfersStatus = exports.$Enums.VendorTransfersStatus = {
  PENDING: 'PENDING',
  REVERSED: 'REVERSED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS'
};

exports.BussinessType = exports.$Enums.BussinessType = {
  HEALTH_CARE: 'HEALTH_CARE',
  NON_HEALTH_CARE: 'NON_HEALTH_CARE'
};

exports.HealthCareBusinessType = exports.$Enums.HealthCareBusinessType = {
  DENTAL_PRACTICE: 'DENTAL_PRACTICE',
  EDUCATIONAL_OR_GOVERNMENT_DENTAL_FACILITY: 'EDUCATIONAL_OR_GOVERNMENT_DENTAL_FACILITY',
  DENTAL_SERVICE: 'DENTAL_SERVICE',
  OTHERS: 'OTHERS'
};

exports.Speciality = exports.$Enums.Speciality = {
  GENERAL_DENTISTRY: 'GENERAL_DENTISTRY',
  ORTHODONTICS: 'ORTHODONTICS',
  ORAL_SURGERY: 'ORAL_SURGERY',
  PERIODONTICS: 'PERIODONTICS',
  ENDODONTICS: 'ENDODONTICS',
  PROSTHODONTICS: 'PROSTHODONTICS',
  PEDODONTICS: 'PEDODONTICS'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PLACED: 'PLACED',
  PACKED: 'PACKED',
  INPROGRESS: 'INPROGRESS',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  CANCELED: 'CANCELED'
};

exports.TransactionStatus = exports.$Enums.TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
  REQUIRES_ACTION: 'REQUIRES_ACTION'
};

exports.OrderRemarks = exports.$Enums.OrderRemarks = {
  REQUEST_INITIATED: 'REQUEST_INITIATED',
  REACHED_WAREHOUSE: 'REACHED_WAREHOUSE',
  QUALITY_CHECK: 'QUALITY_CHECK',
  RETURN_RESULT: 'RETURN_RESULT',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUND_ISSUED: 'REFUND_ISSUED'
};

exports.CancelOrderStatus = exports.$Enums.CancelOrderStatus = {
  CANCELED: 'CANCELED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUND_ISSUED: 'REFUND_ISSUED'
};

exports.IMSTransactionType = exports.$Enums.IMSTransactionType = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT'
};

exports.IMSStatus = exports.$Enums.IMSStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  Category: 'Category',
  Reply: 'Reply',
  Reviews: 'Reviews',
  Material: 'Material',
  Questions: 'Questions',
  Answers: 'Answers',
  Product: 'Product',
  ProductCategory: 'ProductCategory',
  Promotion: 'Promotion',
  BundleDeal: 'BundleDeal',
  ProductVariant: 'ProductVariant',
  VariantAttribute: 'VariantAttribute',
  Address: 'Address',
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  EmergencyContact: 'EmergencyContact',
  AdminRole: 'AdminRole',
  Vendors: 'Vendors',
  Commission: 'Commission',
  VendorTransfers: 'VendorTransfers',
  VendorDebts: 'VendorDebts',
  VendorUPS: 'VendorUPS',
  connectAccount: 'connectAccount',
  User: 'User',
  Chat: 'Chat',
  Message: 'Message',
  LicenseList: 'LicenseList',
  Notification: 'Notification',
  WishList: 'WishList',
  WishlistItem: 'WishlistItem',
  Cart: 'Cart',
  Orders: 'Orders',
  OrderItems: 'OrderItems',
  OrderPromotion: 'OrderPromotion',
  Transaction: 'Transaction',
  AutoOrder: 'AutoOrder',
  AutoOrderItems: 'AutoOrderItems',
  ReturnOrder: 'ReturnOrder',
  ReturnOrderVariant: 'ReturnOrderVariant',
  CancelOrder: 'CancelOrder',
  CancelOrderVariant: 'CancelOrderVariant',
  CartItem: 'CartItem',
  GetInTouch: 'GetInTouch',
  BlogCategory: 'BlogCategory',
  BlogTag: 'BlogTag',
  BlogPost: 'BlogPost',
  BlogPostTag: 'BlogPostTag',
  ImsUser: 'ImsUser',
  ImsUserDetail: 'ImsUserDetail',
  License: 'License',
  Shipping: 'Shipping',
  Billing: 'Billing',
  Agreement: 'Agreement',
  SubscriptionPlan: 'SubscriptionPlan',
  ClientSubscription: 'ClientSubscription',
  Office: 'Office',
  Staff: 'Staff',
  PurchaseOrder: 'PurchaseOrder',
  PurchaseOrderDetail: 'PurchaseOrderDetail',
  PurchaseReturn: 'PurchaseReturn',
  PurchaseReturnDetail: 'PurchaseReturnDetail',
  Inventory: 'Inventory',
  Transfer: 'Transfer',
  TransferDetail: 'TransferDetail',
  Quotation: 'Quotation'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
