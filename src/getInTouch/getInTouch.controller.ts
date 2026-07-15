import {
    Controller,
    Post,
    Body,
    Param,
  } from "@nestjs/common";
  import { GetInTouchService } from "./getInTouch.service";
import { CreateGetInTouchDto } from "./dto/create-getInTouch.dto";
  
  @Controller("user/:userId/getInTouch")
  export class GetInTouchController {
    constructor(private readonly getInTouchService: GetInTouchService) {}
  
    // @UseGuards(JwtGuard, RolesGuard)
    // @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @Post("create")
    createGetInTouch(@Param('userId') userId: string, @Body() createGetInTouch: CreateGetInTouchDto) {
      return this.getInTouchService.createGetInTouch(userId, createGetInTouch);
    }
    
  }
  