import { IsString, IsOptional, ValidateNested, IsEmail, IsEnum } from '@nestjs/class-validator';
import { Transform, Type } from 'class-transformer';
import { BussinessType, HealthCareBusinessType, Speciality } from '@prisma/client';
import { UpdateAddressDto } from './update-address.dto';

export class UpdateUserShopDto {
    @IsEnum(BussinessType)
  @IsOptional()
  businessType?: BussinessType;

  @IsString()
  @IsOptional()
  businessName: string;

  @IsOptional()
  @IsString()
  healthCareBusinessType?: HealthCareBusinessType;

  @IsOptional()
  @IsString()
  speciality?: Speciality;

  @IsString()
  @IsOptional()
  doctorFirstName: string;

  @IsString()
  @IsOptional()
  doctorLastName: string;

  @IsString()
  @IsOptional()
  officeName: string;

  @IsString()
  @IsOptional()
  jobTitle: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address: UpdateAddressDto;

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: "Invalid Email" })
  @Transform(({ value }) => value.toLowerCase())
  shopEmail: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  id: string;
}
