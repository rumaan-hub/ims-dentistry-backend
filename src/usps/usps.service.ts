import { Injectable, HttpException, HttpStatus, Logger, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountUPS } from './dto/create-account.dto';
import { exceptionHandler, handlePrismaError } from 'src/utils/error-handler.util';
import { UpdateAccountUPS } from './dto/update-accout.dto';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class UspsService {
  private tokenExpiration: Date | null = null;
  private isTokenRefreshing = false;
  private tokenRefreshQueue: (() => void)[] = [];

  private readonly upsBaseUrl = process.env.UPS_BASE_URL;
  private readonly upsAuthUrl = process.env.UPS_AUTH_URL;
  private readonly upsAuthorizarionUrl = process.env.UPS_AUTHORIZATION_URL;
  private readonly clientId = process.env.UPS_CLIENT_ID;
  private readonly clientSecret = process.env.UPS_CLIENT_SECRET;
  private token: string | null = null;
  private webhookUrl = process.env.UPS_WEBHOOK;
  private readonly redirectUri: string = process.env.REDIRECT_URI;
  private readonly logger: Logger = new Logger(UspsService.name);
  constructor( 
    private prismaService: PrismaService,
    @Inject(forwardRef(() => OrdersService)) 
    private orderService: OrdersService 
  ) {}

  private async ensureTokenIsValid(): Promise<string> {
    if (!this.token || (this.tokenExpiration && this.tokenExpiration <= new Date())) {
      return this.generateOAuthToken();
    }
    return this.token;
  }

  async generateOAuthToken(): Promise<string> {

    if (this.isTokenRefreshing) {
      return new Promise((resolve) => this.tokenRefreshQueue.push(() => resolve(this.token!)));
    }
    this.isTokenRefreshing = true;

    try {
       const response = await axios.post<{ access_token: string; expires_in: number }>(
        this.upsAuthUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
        },
      );
      this.token = response.data.access_token;
      this.tokenExpiration = new Date(Date.now() + response.data.expires_in * 1000);
      this.isTokenRefreshing = false;
      this.tokenRefreshQueue.forEach((resolve) => resolve());
      this.tokenRefreshQueue = [];
      return this.token;
    } catch (error) {
      this.logger.error('Error generating UPS OAuth token:', error.response?.data || error.message);
      throw new HttpException(
        'Failed to generate UPS OAuth token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async vendorAuthorization(vendorId: string): Promise<string> {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId }
      })
      if(!vendor){
        throw new NotFoundException('Vendor is not found.');
      }

      const queryParams = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        state: 'US',
        scope: vendorId
      });

      const authorizationUrl = `${this.upsAuthorizarionUrl}?${queryParams.toString()}`;
      if(!authorizationUrl){
        throw new NotFoundException("Authorization url not found");
      }
      return authorizationUrl;
    } catch (error) {
      this.logger.error('Failed to generate UPS OAuth authorization URL', error);
      throw new HttpException(
        `UPS OAuth setup error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exchangeCodeForToken(query: any): Promise<any> {
    try {
      const { code, error, scope, error_description } = query;

      if (error) {
        throw new BadRequestException(`UPS OAuth error: ${error_description || error}`);
      }
      if (!code) {
        throw new BadRequestException('Authorization code not received');
      }
      if(scope){
        const vendor = await this.prismaService.vendors.findUnique({
          where: { id: scope }
        })
        if(!vendor){
          throw new NotFoundException("Vendor not found");
        }
      }

      if (!this.clientId || !this.clientSecret || !this.redirectUri) {
        throw new BadRequestException('OAuth configuration missing');
      }

      const response = await axios.post(
        this.upsAuthUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'x-merchant-id': 'string',
          },
        }
      );

      if(scope){
        await this.prismaService.vendorUPS.upsert({
          where: { vendorId: scope },
          update: {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            accessTokenExpiresAt: new Date(Date.now() + response.data.expires_in * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + (response.data.refresh_expires_in || 7 * 24 * 60 * 60) * 1000),
          },
          create: {
            vendorId: scope,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            accessTokenExpiresAt: new Date(Date.now() + response.data.expires_in * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + (response.data.refresh_expires_in || 7 * 24 * 60 * 60) * 1000),
          }
        })
      }
      
      return response.data;
      
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
      throw new HttpException(
        `Token exchange failed: ${error.response?.data?.error_description || error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getValidTokenForVendor(vendorId: string): Promise<string> {
    const tokenData = await this.prismaService.vendorUPS.findUnique({
      where: {
        id: vendorId
      }
    })
    const isExpired = this.isTokenExpired(tokenData.accessTokenExpiresAt);
    
    if (!isExpired) {
      return tokenData.accessToken;
    }

    return await this.refreshAccessToken(tokenData.refreshToken);
  }

  async isTokenExpired(expiryDate: Date): Promise<boolean> {
    return new Date() >= expiryDate;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await axios.post(
        this.upsAuthUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'x-merchant-id': 'testing',
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw new HttpException(
          'Refresh token expired. Please re-authenticate with UPS.',
          HttpStatus.UNAUTHORIZED
        );
      }
      throw error;
    }
  }

  async createUPSAccount(vendorId: string, accountData: CreateAccountUPS) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: {
          id: vendorId,
        },
      });
      if (!vendor) {
        throw new NotFoundException("Vendor not found.");
      }
      if(!accountData.accountNo){
        throw new BadRequestException("Account number is required");
      }
      
      const newAccount = await this.prismaService.vendorUPS.update({
        where: { vendorId },
        data: {
          ...accountData,
        },
      });
      return {
        data: newAccount,
        message: "Account has been created successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting super Admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  
  async updateDeliveryAccount(accountId: string, accountData: UpdateAccountUPS) {
    try {
      const upsAccount = await this.prismaService.vendorUPS.findUnique({
        where: {
          id: accountId
        }
      })
      if (!upsAccount) {
        throw new NotFoundException("No UPS acount of vendor with the provided ID");

      }
      const updatedAccount = await this.prismaService.vendorUPS.update({
        where: {
          id: accountId,
        },
        data: {
          ...accountData,
        },
      });
      return {
        data: updatedAccount,
        message: "Account has been updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error updating account", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async trackOrder(trackingNumber: string): Promise<any> {
    if (!this.token) {
      await this.generateOAuthToken();
    }

    const query = new URLSearchParams({
      locale: 'en_US',
      returnSignature: 'false',
      returnMilestones: 'false',
      returnPOD: 'false'
    }).toString();
    const fullUrl = `${this.upsBaseUrl}/track/v1/details/${trackingNumber}?${query}`;
    try {
      const response = await axios.get(
        fullUrl,
        {
          headers: {
            transId: 'string',
            transactionSrc: 'testing',
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
  
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching UPS tracking details:', error);
      if (error.response?.status === 401) {
        this.token = null;
        return this.trackOrder(trackingNumber);
      }

      throw new HttpException(
        error.response?.data || 'Error fetching tracking details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateOrderTrackingStatus() {
    try {
      const orders = await this.prismaService.orders.findMany({
        where: { trackingNo: { not: '' } },
        select: { id: true, trackingNo: true, status: true }
      });
      if (!orders.length) return;
  
      const batchSize = 50;
      const orderBatches = [];
      for (let i = 0; i < orders.length; i += batchSize) {
        orderBatches.push(orders.slice(i, i + batchSize));
      }

      for (const batch of orderBatches) {
        await Promise.all(batch.map(async (order) => {
          try {
            const trackingData = await this.trackOrder(order.trackingNo);
            const latestStatus = trackingData?.trackResponse?.shipment
              ?.flatMap(shipment => shipment.package)
              ?.map(pkg => ({
                status: pkg.currentStatus?.code
              }))
              ?.sort((a, b) => (b.date + b.time) - (a.date + a.time))?.[0]?.status;
  
            const statusMapping: { [key: string]: string } = {
              "003": "SHIPPED",
              "005": "SHIPPED",
              "071": "SHIPPED",
              "021": "SHIPPED",
              "011": "DELIVERED",
            };

            const newStatus = latestStatus ? statusMapping[latestStatus] : order.status;
            if (newStatus !== order.status) {
              await this.prismaService.orders.update({
                where: { id: order.id },
                data: { status: newStatus }
              });
            }
  
          } catch (error) {
            this.logger.error(`Failed to update tracking for Order ${order.id}:`, error);
          }
        }));
  
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      this.logger.error("Error updating order tracking status:", error);
      throw new HttpException(
        error.response?.data || "Error updating order tracking details",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  async getShippingRatesForOrder(userId: string, cartId: string, addressId: string) {
    const [user, cart, address, cartItems] = await Promise.all([
      this.prismaService.user.findUnique({
        where: { id: userId }
      }),
      this.prismaService.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      vendor: {
                        include: {
                          address: true,
                          ups: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      this.prismaService.address.findUnique({ where: { id: addressId } }),
      this.prismaService.cartItem.findMany({ where: { cartId : cartId }})
    ]);
        
    if (!cartItems) throw new Error('cartItems not found');
    if (!user) throw new Error('User not found');
    if (!cart) throw new Error('Cart not found');
    if (!address) throw new Error('Address not found');

    const vendorGroups = this.groupItemsByVendor(cart.items);

    const vendorRates = await Promise.all(
      vendorGroups.map(async (vendorGroup) => {
        const vendor = vendorGroup.vendor;
        const upsAccount = vendor.ups[0];
        const accountNumber = upsAccount ? upsAccount.accountNo : "R2180C";

        let packageDetails: any;
        try {
          packageDetails = this.calculatePackageDetails(vendorGroup.items, ["UPS"]);
        } catch (err) {
          this.logger.warn(`Package detail calculation failed for vendor ${vendor.id}: ${err.message}`);
          return {
            vendorId: vendor.id,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            rates: null,
            packageDetails: null,
            message: `Unable to calculate package details: ${err.message}`,
          };
        }

        if (!packageDetails) {
          return {
            vendorId: vendor.id,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            rates: null,
            packageDetails: null,
            message: "No eligible items for shipping rate calculation (all products have flat)",
          };
        }

        if (!vendor.address?.zipCode || !vendor.address?.streetAddress) {
          return {
            vendorId: vendor.id,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            rates: null,
            packageDetails,
            message: "Vendor address is incomplete for UPS rate calculation",
          };
        }

        try {
          const rateRequest = this.buildVendorRateRequest(
            vendor,
            accountNumber,
            user,
            address,
            packageDetails
          );
          const rates = await this.getShippingRates(rateRequest);
          return {
            vendorId: vendor.id,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            rates,
            packageDetails,
          };
        } catch (err) {
          this.logger.warn(`UPS rate fetch failed for vendor ${vendor.id}: ${err.message}`);
          return {
            vendorId: vendor.id,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            rates: null,
            packageDetails,
            message: `UPS rate unavailable: ${err.message}`,
          };
        }
      })
    );

    return vendorRates;
  }

  private groupItemsByVendor(items: any[]) {
    const vendorMap = new Map<string, any>();
    
    items.forEach(item => {
      const vendorId = item.variant.product.vendor.id;
      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendor: item.variant.product.vendor,
          items: []
        });
      }
      vendorMap.get(vendorId).items.push(item);
    });

    return Array.from(vendorMap.values());
  }

  private calculatePackageDetails(items: any[], allowedMethods: string[]) {
    try {
      let totalWeight = 0;
      let maxLength = 0;
      let maxWidth = 0;
      let totalHeight = 0;
      let itemCount = 0;

      const eligibleItems = items.filter((item) =>
        allowedMethods.includes(item.variant.product.shippingMethod)
      );

      if (eligibleItems.length === 0) {
        return null;
      }

      eligibleItems.forEach((item) => {
        if (!item.variant || !item.variant.product) {
          throw new Error(`Invalid product structure for variant: ${item.variant?.id}`);
        }

        const quantity = item.quantity;
        const itemWeight = parseFloat(item.variant.product.weight) * quantity;
        const itemLength = parseFloat(item.variant.product.length);
        const itemWidth = parseFloat(item.variant.product.width);
        const itemHeight = parseFloat(item.variant.product.height);

        if (isNaN(itemLength) || isNaN(itemWidth) || isNaN(itemHeight) || isNaN(itemWeight)) {
          throw new Error(`Invalid dimensions for product: ${item.variant.product.title}`);
        }

        if (itemCount === 0) {
          maxLength = itemLength;
          maxWidth = itemWidth;
          totalHeight = itemHeight * quantity;
        } else {
          maxLength = Math.max(maxLength, itemLength);
          maxWidth = Math.max(maxWidth, itemWidth);
          totalHeight += itemHeight * quantity;
        }

        totalWeight += itemWeight;
        itemCount += quantity;
      });

      return {
        totalWeight,
        maxLength,
        maxWidth,
        totalHeight,
        itemCount,
      };
    } catch (error) {
      const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const upsErrorMessage = error.response?.data?.response?.errors?.[0]?.message || error.message;

      throw new HttpException(
        {
          statusCode,
          message: `Error calculating package details: ${upsErrorMessage}`,
        },
        statusCode
      );
    }
  }

  async getShippingRates(rateRequest: any): Promise<any> {
    try {
      const token = await this.ensureTokenIsValid();
      const version = "v2403";
      const requestoption = "shop";
      const additionalinfo = "timeintransit";
      const response = await axios.post(
        `${this.upsBaseUrl}/rating/${version}/${requestoption}?additionalinfo=${additionalinfo}`,
        rateRequest,
        {
          headers: {
            transId: 'string',
            transactionSrc: 'testing',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const upsErrorMessage = error.response?.data?.response?.errors?.[0]?.message || error.message || 'UPS API Error';
      throw new HttpException(
        {
          statusCode,
          message: `UPS API Error: ${upsErrorMessage}`,
        },
        statusCode
      );
    }
  }

  private buildVendorRateRequest(vendor: any, accountNumber: any, user: any, address: any, packageDetails: any) {
    return {
      RateRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: "Order_" + Date.now(),
            TransactionIdentifier: "TRX_" + Date.now()
          }
        },
        Shipment: {
          DeliveryTimeInformation: {
            PackageBillType: "03",
            Pickup: {
              Date: this.formatDate(new Date()),
              Time: "1000"
            }
          },
          Shipper: {
            Name: `${vendor.firstName} ${vendor.lastName}`,
            ShipperNumber: accountNumber,
            Address: {
              AddressLine: [
                vendor?.address?.streetAddress,
              ],
              City: vendor.address?.city,
              StateProvinceCode: vendor.address?.state,
              PostalCode: vendor.address?.zipCode,
              CountryCode: vendor.address?.country || 'US'
            }
          },
          ShipTo: {
            Name: `${user.firstName} ${user.lastName}`,
            Address: {
              AddressLine: [
                address.streetAddress
              ],
              City: address.city,
              StateProvinceCode: address.state,
              PostalCode: address.zipCode,
              CountryCode: address.country || 'US'
            }
          },
          ShipFrom: {
            Name: `${vendor.firstName} ${vendor.lastName}`,
            Address: {
              AddressLine: [
                vendor.address?.streetAddress
              ],
              City: vendor.address?.city,
              StateProvinceCode: vendor.address?.state,
              PostalCode: vendor.address?.zipCode,
              CountryCode: vendor.address?.country || 'US'
            }
          },
          PaymentDetails: {
            ShipmentCharge: {
              Type: "01",
              BillShipper: {
                AccountNumber: accountNumber,
              }
            }
          },
          NumOfPieces: "1",
          Package: {
            PackagingType: {
              Code: "02",
              Description: "Customer Packaging"
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: "IN",
                Description: "Inches"
              },
              Length: String(packageDetails.maxLength),
              Width: String(packageDetails.maxWidth),
              Height: String(packageDetails.totalHeight)
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: "LBS",
                Description: "Pounds"
              },
              Weight: String(packageDetails.totalWeight)
            }
          }
        }
      }
    };
  }

  private formatDate(date: Date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  async shippingRatesForLabel(items: any, userId: any, addressId: any, vendorId: any){

    const user = await this.prismaService.user.findUnique({
      where: { id: userId }
    })
    if(!user){
      throw new NotFoundException("User not found");
    }
    const address = await this.prismaService.address.findUnique({
      where: { id: addressId }
    })
    if(!address){
      throw new NotFoundException("Address not found");
    }
    const vendor = await this.prismaService.vendors.findUnique({
      where: { id: vendorId },
      include: {
        address: true
      }
    })
    if(!vendor){
      throw new NotFoundException("Vendor not found");
    }

    const packageDetails = this.calculatePackageDetails(items, ["FLAT", "UPS"]);
    const accountNumber = "R2180C";
    const rateRequest = this.buildVendorRateRequest(
      vendor,
      accountNumber,
      user,
      address,
      packageDetails
    );

    const rates = await this.getShippingRates(rateRequest);
  
    return {
      vendorId: vendor.id,
      vendorName: `${vendor.firstName} ${vendor.lastName}`,
      rates,
      packageDetails
    };
  }

  async subscribeToTrackingUpdates(trackingNumbers: string[]) {
    try {
      if (!this.token) await this.generateOAuthToken();
      const invalidNumbers = trackingNumbers.filter(num => !this.isValidUPSTrackingNumber(num));
      if (invalidNumbers.length > 0) {
        throw new Error(`Invalid tracking numbers: ${invalidNumbers.join(', ')}`);
      }

      if(!this.webhookUrl){
        throw new NotFoundException("webHook url not found");
      }

      const isTesting = 'https://wwwcie.ups.com/api';

      if(this.upsBaseUrl === isTesting){
        this.logger.warn("Running in test environment, skipping UPS subscription");
        return {
          validTrackingNumbers: trackingNumbers,
          invalidTrackingNumbers: [],
        };
      }

      const credential = 'string';
      const version = 'v1';
      const requestBody = {
        locale: 'en_US',
        countryCode: 'US',
        trackingNumberList: trackingNumbers,
        destination: {
          url: this.webhookUrl,
          credentialType: 'Bearer',
          credential: credential
        }
      };

      const response = await fetch(
        `${this.upsBaseUrl}/track/${version}/subscription/standard/package`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            transId: 'subscription_' + Date.now(),
            transactionSrc: 'Dentistry99',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const responseData = await response.json();
      if (!response.ok || responseData?.response?.errors) {
        this.logger.error('UPS Subscription Error:', responseData);
        throw new BadRequestException(`UPS Subscription failed: ${JSON.stringify(responseData)}`);
      }
  
      return responseData;
    } catch (error) {
      this.logger.error('Failed to process UPS webhook:', error);
      throw error;
    }
  }

  async processTrackingUpdate(payload: any) {
    try {
      let trackingNumber: string | undefined;
      let statusType: string | undefined;

      if (payload.trackingNumber && payload.activityStatus?.type) {
        trackingNumber = payload.trackingNumber;
        statusType = payload.activityStatus.type;
      }
      else if (payload?.TrackResponse?.Shipment?.Package) {
        trackingNumber = Array.isArray(payload.TrackResponse.Shipment.Package.TrackingNumber)
          ? payload.TrackResponse.Shipment.Package.TrackingNumber[0]
          : payload.TrackResponse.Shipment.Package.TrackingNumber;
        statusType =
          payload.TrackResponse.Shipment.Package.CurrentStatus?.Type ||
          payload.TrackResponse.Shipment.Package.CurrentStatus?.Status;
      }

      if (!trackingNumber || !statusType) {
        this.logger.error(
          `Invalid UPS webhook payload: missing ${!trackingNumber ? 'trackingNumber' : ''} ${
            !statusType ? 'activityStatus.type or CurrentStatus.Type/Status' : ''
          }`,
          payload,
        );
        throw new BadRequestException(
          `Invalid UPS webhook payload: missing ${!trackingNumber ? 'trackingNumber' : ''} ${
            !statusType ? 'activityStatus.type or CurrentStatus.Type/Status' : ''
          }`,
        );
      }

      const orderItems = await this.prismaService.orderItems.findMany({
        where: {
          trackingNo: trackingNumber
        },
        include: {
          order: true,
          vendor: true
        }
      });

      if (orderItems.length === 0) {
        this.logger.log(`No order items found for tracking number: ${trackingNumber}`);
        return;
      }

      const itemsByOrder = orderItems.reduce((acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = {
            order: item.order,
            itemsByVendor: {}
          };
        }
        
        if (!acc[item.orderId].itemsByVendor[item.vendorId]) {
          acc[item.orderId].itemsByVendor[item.vendorId] = [];
        }
        
        acc[item.orderId].itemsByVendor[item.vendorId].push(item);
        return acc;
      }, {});

      const newStatus = this.statusMapping[statusType] || this.statusMapping['default'];
      const currentDate = new Date().toISOString();

      for (const [orderId, orderData] of Object.entries(itemsByOrder)) {
        const { order, itemsByVendor } = orderData as any;

        for (const [vendorId, items] of Object.entries(itemsByVendor)) {
          await this.prismaService.$transaction(async (prisma) => {
            const updatedItems = await Promise.all(
              (items as any[]).map(async (item) => {
                let trackStatus: any[] = [];

                try {
                  trackStatus = Array.isArray(item.trackStatus)
                    ? item.trackStatus
                    : JSON.parse(item.trackStatus || '[]');
                } catch (e) {
                  trackStatus = [];
                }

                const existingStatusIndex = trackStatus.findIndex(
                  (s) => s.status === newStatus && s.trackingNumber === trackingNumber
                );

                const statusUpdate = {
                  status: newStatus,
                  date: currentDate
                };

                if (existingStatusIndex >= 0) {
                  trackStatus[existingStatusIndex] = statusUpdate;
                } else {
                  trackStatus.push(statusUpdate);
                }

                return prisma.orderItems.update({
                  where: {
                    orderId_variantId: {
                      orderId: item.orderId,
                      variantId: item.variantId,
                    }
                  },
                  data: {
                    status: newStatus,
                    trackStatus: trackStatus,
                  },
                });
              })
            );

            const undeliveredItems = await prisma.orderItems.count({
              where: {
                orderId: order.id,
                status: { not: OrderStatus.DELIVERED },
              },
            });

            if (undeliveredItems === 0) {
              await prisma.orders.update({
                where: { id: order.id },
                data: { status: OrderStatus.DELIVERED },
              });
            }

            this.logger.log(`Order ${order.id} items updated to ${newStatus} (UPS Status: ${statusType}) for vendor ${vendorId}`);

            const commission = await prisma.commission.findUnique({ 
              where: { vendorId } 
            });
            
            if (!commission) {
              this.logger.log(`No commission found for vendor ${vendorId}`);
              return;
            }
            
            const allVendorItems = await prisma.orderItems.findMany({
              where: {
                orderId: order.id,
                vendorId: vendorId
              }
            });

            const payOnStatusValue = this.getOrderStatusValue(commission.payOnStatus);
            
            if (typeof payOnStatusValue !== 'number') {
              this.logger.error(`Invalid payOnStatus "${commission.payOnStatus}" for vendor ${vendorId}`);
              return;
            }

            const allItemsMeetStatus = allVendorItems.every(item => {
              const itemStatusValue = this.getOrderStatusValue(item.status);
              if (typeof itemStatusValue !== 'number') {
                this.logger.warn(`Invalid status "${item.status}" found for order product`);
                return false;
              }
              return itemStatusValue >= payOnStatusValue;
            });

            if (allItemsMeetStatus) {
              const existingTransfer = await prisma.vendorTransfers.findFirst({
                where: {
                  orderId: order.id,
                  vendorId: vendorId,
                  status: 'COMPLETED'
                }
              });

              if (!existingTransfer) {
                await this.orderService.handleVendorTransfer(
                  order.id, 
                  vendorId, 
                  commission.payOnStatus
                );
                this.logger.log(`Vendor transfer processed for order ${order.id} and vendor ${vendorId}`);
              } else {
                this.logger.log(`Transfer already completed for order ${order.id} and vendor ${vendorId}`);
              }
            } else {
              this.logger.log(`Not all items meet required status for transfer for vendor ${vendorId}`);
            }
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to process UPS webhook:', error);
      throw error;
    }
  }

  async isValidUPSTrackingNumber(trackingNumber: string): Promise<boolean> {
    const upsRegex = /^1Z[0-9A-Z]{16}$/i;
    return upsRegex.test(trackingNumber);
  }

  private readonly statusMapping: Record<string, OrderStatus> = {
    "D": OrderStatus.DELIVERED,
    "DP": OrderStatus.DELIVERED,
    "DY": OrderStatus.DELIVERED,
  };

  private getOrderStatusValue(status: string): number | undefined {
    const statuses = Object.keys(OrderStatus) as Array<keyof typeof OrderStatus>;
    const index = statuses.findIndex(s => OrderStatus[s] === status);
    return index >= 0 ? index : undefined;
  }

}
