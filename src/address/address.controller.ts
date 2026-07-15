import {
    Controller,
    Post,
    Param,
    Body,
    Put,
    Get,
    Delete,
    UseGuards,
  } from "@nestjs/common";
  import { CreateAddressDto } from "./dto/create-address.dto";
import { AddressService } from "./address.service";
import { UpdateAddressDto } from "./dto/updateAddress.dto";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
  
  @Controller("user/:userId/address")
  export class AddressController {
    constructor(private readonly addressService: AddressService) {}
    
    @UseGuards(JwtGuard, RolesGuard)
    @Post("create")
    createAddress(@Param('userId') userId: string, @Body() addressData: CreateAddressDto ) {
      return this.addressService.createAddress(userId, addressData);
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Get('')
    findUserAddress(@Param('userId') userId: string) {
      return this.addressService.findUserAddress(userId)
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Get(':id')
    findAddressById(@Param('userId') userId: string, @Param('id') id: string) {
      return this.addressService.findAddressById(userId, id)
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Put(':addressId/update')
    updateAddress(@Param('userId') userId: string, @Param('addressId') addressId: string, @Body() updatedData: UpdateAddressDto) {
      return this.addressService.updateAddress(userId, addressId, updatedData)
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Delete(':addressId/delete')
    deleteAddress(@Param('userId') userId: string, @Param('addressId') addressId: string) {
      return this.addressService.deleteAddress(userId, addressId)
    }
  }
  