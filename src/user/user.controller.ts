import {
  Controller,
  Post,
  Body,
  Put,
  UseGuards,
  Param,
  Delete,
  Get,
  Req,
  Query,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtGuard } from "./guard/jwt.guard";
import { RolesGuard } from "./role/role.guard";
import { UpdateVerfication } from "./dto/update-verfication.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Roles } from "./role/role.decorator";
import { Role } from "./role/role.enum";
import { GoogleAuthDTO, LoginDTO, ResendEmailDTO } from "./dto/login-user.dto";
import { UpdatePasswordDto } from "./dto/updatePasswordDto.dto copy";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { UserFilter } from "./dto/filter.option.dto";
import { Public } from "./guard/public.decorator";

@Controller("client")
export class UserController {
  constructor(private readonly userService: UserService) { }
  @Public()
  @Post("signup")
  signupForClient(@Body() createAdminDto: CreateUserDto) {
    return this.userService.signupForClient(createAdminDto);
  }

  @Public()
  @Get('verify-email')
  async verifyUserEmail(@Query('token') token: string) {
    return this.userService.verifyUserEmail(token);
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body() body: ResendEmailDTO) {
    return this.userService.resendVerificationEmail(body.email);
  }

  @Get('me')
  getUserByToken(@Req() req) {
    return this.userService.getUserByToken(req)
  }

  @Public()
  @Put("forgetPassword")
  forgetPassword(@Body("email") email: string) {
    return this.userService.forgetPassword(email);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  @Put("verifyToken")
  verifyToken() {
    return this.userService.verifyToken();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  @Post(":id/update-Password")
  updatePassword(@Param("id") id: string, @Body() dto: UpdatePasswordDto) {
    return this.userService.updatePassword(id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  @Post(":id/reset-Password")
  resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(id, dto);
  }
  @Public()
  @Post("login")
  login(@Body() createAdminDto: LoginDTO) {
    return this.userService.login(createAdminDto);
  }

  @Public()
  @Post("google-auth")
  googleAuth(@Body() body: GoogleAuthDTO) {
    return this.userService.googleAuthForClient(body.idToken);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put("verify/:id")
  verifyUser(
    @Param("id") id: string,
    @Body() verifiedUserDto: UpdateVerfication
  ) {
    return this.userService.verifyUser(id, verifiedUserDto.isVerified);
  }
  @UseGuards(JwtGuard)
  @Delete("delete/:id")
  deleteUser(@Param("id") userId: string, @Req() req) {
    return this.userService.deleteUser(userId, req.user);
  }
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete("deleteByAdmin/:adminId/:id")
  deleteUserByAdmin(
    @Param("adminId") adminId: string,
    @Param("id") userId: string
  ) {
    return this.userService.deleteUserByAdmin(adminId, userId);
  }
  @UseGuards(JwtGuard)
  @Put("update/:id")
  updateUser(
    @Param("id") userId: string,
    @Body() updatedUserData: UpdateUserDto,
    @Req() req
  ) {
    return this.userService.updateUser(userId, updatedUserData, req.user);
  }

  @UseGuards(JwtGuard)
  // @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get(":id")
  findUser(@Param("id") userId: string) {
    return this.userService.findUser(userId);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('all/details')
  fetchAllUsers(@Query() filter: UserFilter) {
    return this.userService.fetchAllUsers(filter);
  }
}
