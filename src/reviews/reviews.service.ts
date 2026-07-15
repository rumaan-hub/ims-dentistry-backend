import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewsDto } from "./dto/create-reviews.dto";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { CreateReplyDto } from "./dto/create-reply.dto";
import { UpdateReviewsDto } from "./dto/update-reviews.dto";
import { UpdateReplyDto } from "./dto/update-reply.dto";

@Injectable()
export class ReviewsService {
  private readonly logger: Logger = new Logger(ReviewsService.name);

  constructor(private prismaService: PrismaService) {}

  async createReview(
    userId: string,
    productId: string,
    createReview: CreateReviewsDto
  ) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { id: productId },
        
      });
      if (!product) {
        throw new NotFoundException("Product not found!");
      }
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException("User not found");
      }
      const review = await this.prismaService.reviews.create({
        data: {
          ...createReview,
          productId,
          userId,
          images: product.images
        },
      });
      await this.prismaService.product.update({
        where: { id: productId },
        data: {
          totalReviews: { increment: 1 },
        },
      });
      return {
        message: "Review has been created successfully!",
        data: review,
      };
    } catch (error) {
      this.logger.error("Error creating Review", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async createReply(
    userId: string,
    reviewId: string,
    createReply: CreateReplyDto
  ) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new NotFoundException("User does not found");
      }
      const review = await this.prismaService.reply.create({
        data: {
          ...createReply,
          reviewId,
          userId,
        },
      });
      return {
        message: "Reply has been created successfully!",
        data: review,
      };
    } catch (error) {
      this.logger.error("Error creating reply", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getUserReviews(userId: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new NotFoundException("User does not found");
      }
      const reviews = await this.prismaService.reviews.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          product: {
            include:{
              variants:{
                include:{
                  orders:{
                    include:{
                      order:{
                        select: {
                          createdAt: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          reply: true,
        },
      });
      const reviewsWithPurchaseDate = reviews.map((review) => {
        const order = review.product?.variants?.[0]?.orders?.[0]?.order;
        return {
          ...review,
          purchaseDate: order?.createdAt,
        };
      });
      return {
        data: reviewsWithPurchaseDate,
      };
    } catch (error) {
      this.logger.error("Error update Review", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAllReviews(productId: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: {
          id: productId,
        },
      });
      if (!product) {
        throw new NotFoundException("Product not found!");
      }
      const reviews = await this.prismaService.reviews.findMany({
        where: {
          productId,
        },
        include: {
          user: true,
          product: true,
          reply: true,
        },
      });
      return {
        data: reviews,
      };
    } catch (error) {
      this.logger.error("Error getting Reviews", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateReview(
    userId: string,
    reviewId: string,
    updatedReviewData: UpdateReviewsDto
  ) {
    try {
      const review = await this.prismaService.reviews.findUnique({
        where: { id: reviewId },
      });
  
      if (!review) {
        throw new NotFoundException("Review not found!");
      }
  
      if (review.userId !== userId) {
        throw new ConflictException(
          "Sorry, you don't have access to perform this action!"
        );
      }

      const updateReview = await this.prismaService.reviews.update({
        where: { id: reviewId },
        data: updatedReviewData,
      });
  
      return {
        message: "Review has been updated successfully!",
        data: updateReview,
      };
    } catch (error) {
      this.logger.error("Error updating review", error);
  
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
  
      if (error.code) {
        throw handlePrismaError(error);
      }
  
      throw new InternalServerErrorException("An unexpected error occurred.");
    }
  }

  async getReview(reviewId: string) {
    try {
      const review = await this.prismaService.reviews.findUnique({
        where: { id: reviewId },
        include: {
          reply: true,
        },
      });

      if (!review) {
        throw new NotFoundException('Review not found!');
      }

      return {
        message: 'Review and reply retrieved successfully!',
        data: review,
      };
    } catch (error) {
      throw new NotFoundException(error.message || 'An error occurred');
    }
  }
  

  async updateReply(
    userId: string,
    replyId: string,
    updateReply: UpdateReplyDto
  ) {
    try {
      const review = await this.prismaService.reply.findUnique({
        where: {
          id: replyId,
        },
        include: {
          user: true,
        },
      });
      if (!review) {
        throw new NotFoundException("Reply not found!");
      }
      if (review?.userId !== userId) {
        throw new ConflictException(
          "Sorry, you don't have access to perform this action!"
        );
      }

      const updateReview = await this.prismaService.reply.update({
        where: {
          id: replyId,
        },
        data: updateReply
      });
      return {
        message: "Review has been updated successfully!",
        data: updateReview,
      };
    } catch (error) {
      this.logger.error("Error update reply", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteReview(userId: string, reviewId: string) {
    try {
      const review = await this.prismaService.reviews.findUnique({
        where: {
          userId,
          id: reviewId,
        },
        include: {
          reply: true
        }
      });
      if (review.userId !== userId) {
        throw new ConflictException(
          "Sorry, you don't have access to perform this action!"
        );
      }
      if (!review) {
        throw new NotFoundException("Review not found!");
      }
      if(review?.reply){
        throw new BadRequestException("You cannot delete this review because it has a reply");
      }
      await this.prismaService.reviews.delete({
        where: {
          id: reviewId,
        },
      });
      return {
        message: "Review has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error delete review", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteReply(userId: string, replyId: string) {
    const reply = await this.prismaService.reply.findUnique({
      where: {
        userId,
        id: replyId,
      },
    });
    if (reply.userId !== userId) {
      throw new ConflictException(
        "Sorry, you don't have access to perform this action!"
      );
    }
    if (!reply) {
      throw new NotFoundException("Reply not found!");
    }
    await this.prismaService.reply.delete({
      where: {
        id: replyId,
      },
    });
    return {
      message: "Reply has been deleted successfully!",
    };
  }
}
