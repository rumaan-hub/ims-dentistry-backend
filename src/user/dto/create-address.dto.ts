import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
   @IsString()
   @IsNotEmpty()
   street: string;

   @IsString()
   @IsNotEmpty()
   city: string;

   @IsString()
   @IsNotEmpty()
   state: string;

   @IsString()
   @IsNotEmpty()
   country: string;

   @IsString()
   @IsNotEmpty()
   zipCode: string;

   @IsString()
   @IsNotEmpty()
   long: string;

   @IsString()
   @IsNotEmpty()
   lat: string;
}
