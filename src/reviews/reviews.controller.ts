import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Put,
  Param,
  Delete,
} from "@nestjs/common";
import { CreateReviewsDto } from "./dto/create-reviews.dto";
import { ReviewsService } from "./reviews.service";
import { CreateReplyDto } from "./dto/create-reply.dto";
import { UpdateReplyDto } from "./dto/update-reply.dto";
import { UpdateReviewsDto } from "./dto/update-reviews.dto";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Roles } from "src/user/role/role.decorator";
import { Role } from "src/user/role/role.enum";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @UseGuards(JwtGuard)
  @Post("user/:userId/product/:productId/create")
  createReview(
    @Param("userId") userId: string,
    @Param("productId") productId: string,
    @Body() createCategory: CreateReviewsDto
  ) {
    return this.reviewService.createReview(userId, productId, createCategory);
  }

  @UseGuards(JwtGuard)
  @Post("user/:userId/review/:reviewId")
  createReply(
    @Param("userId") userId: string,
    @Param("reviewId") reviewId: string,
    @Body() createReply: CreateReplyDto
  ) {
    return this.reviewService.createReply(userId, reviewId, createReply);
  }

  @UseGuards(JwtGuard)
  @Get("product/:productId")
  getAllReviews(
    @Param("productId") productId: string
  ) {
    return this.reviewService.getAllReviews(productId);
  }

  @UseGuards(JwtGuard)
  @Get("user/:userId")
  getUserReviews(@Param("userId") userId: string) {
    return this.reviewService.getUserReviews(userId);
  }

  @UseGuards(JwtGuard)
  @Get(":reviewId")
  getReview(@Param("reviewId") reviewId: string) {
    return this.reviewService.getReview(reviewId);
  }

  @UseGuards(JwtGuard)
  @Put("user/:userId/review/:reviewId/update")
  updateReview(
    @Param("userId") userId: string,
    @Param("reviewId") reviewId: string,
    @Body() updateReviewData: UpdateReviewsDto
  ) {
    return this.reviewService.updateReview(userId, reviewId, updateReviewData);
  }

  @UseGuards(JwtGuard)
  @Put("user/:userId/reply/:replyId/update")
  updateReply(
    @Param("userId") userId: string,
    @Param("replyId") replyId,
    @Body() updateReply: UpdateReplyDto
  ) {
    return this.reviewService.updateReply(userId, replyId, updateReply);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER, Role.VENDOR)
  @Delete("user/:userId/review/:reviewId/delete")
  deleteReview(
    @Param("userId") userId: string,
    @Param("reviewId") reviewId: string
  ) {
    return this.reviewService.deleteReview(userId, reviewId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER, Role.VENDOR)
  @Delete("user/:userId/reply/:replyId/delete")
  deleteReply(
    @Param("userId") userId: string,
    @Param("replyId") replyId: string
  ) {
    return this.reviewService.deleteReply(userId, replyId);
  }
}
