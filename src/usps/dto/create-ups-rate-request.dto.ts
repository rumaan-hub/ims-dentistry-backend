export class CreateUpsRateRequestDto {
    RateRequest: {
      Request: {
        TransactionReference: {
          CustomerContext: string;
          TransactionIdentifier: string;
        };
      };
      Shipment: {
        DeliveryTimeInformation: {
          PackageBillType: string;
          Pickup: {
            Date: string;
            Time: string;
          };
        };
        Shipper: {
          Name: string;
          ShipperNumber: string;
          Address: {
            AddressLine: string[];
            City: string;
            StateProvinceCode: string;
            PostalCode: string;
            CountryCode: string;
          };
        };
        ShipTo: {
          Name: string;
          Address: {
            AddressLine: string[];
            City: string;
            StateProvinceCode: string;
            PostalCode: string;
            CountryCode: string;
          };
        };
        ShipFrom: {
          Name: string;
          Address: {
            AddressLine: string[];
            City: string;
            StateProvinceCode: string;
            PostalCode: string;
            CountryCode: string;
          };
        };
        PaymentDetails: {
          ShipmentCharge: {
            Type: string;
            BillShipper: {
              AccountNumber: string;
            };
          };
        };
        Service?: {
          Code: string;
          Description: string;
        };
        NumOfPieces: string;
        Package: {
          SimpleRate: {
            Description: string;
            Code: string;
          };
          PackagingType: {
            Code: string;
            Description: string;
          };
          Dimensions: {
            UnitOfMeasurement: {
              Code: string;
              Description: string;
            };
            Length: string;
            Width: string;
            Height: string;
          };
          PackageWeight: {
            UnitOfMeasurement: {
              Code: string;
              Description: string;
            };
            Weight: string;
          };
        };
      };
    };
  }