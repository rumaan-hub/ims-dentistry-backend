import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateAddressDto {
   @IsUUID()
   @IsOptional()
   id?: string;
 
   @IsOptional()
   @IsString()
   streetAddress?: string;
 
   @IsOptional()
   @IsString()
   city?: string;
 
   @IsOptional()
   @IsString()
   state?: string;
 
   @IsOptional()
   @IsString()
   zipCode?: string;
 
   @IsOptional()
   @IsString()
   country?: string;
 }