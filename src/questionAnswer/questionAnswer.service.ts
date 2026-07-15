import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { CreateQuestionsDto } from "./dto/create-questions.dto";
import { CreateAnswerDto } from "./dto/create-answer.dto";
import { UpdateQuestionsDto } from "./dto/update-questions.dto";
import { UpdateAnswerDto } from "./dto/update-answer.dto";

@Injectable()
export class QuestionAnswerService {
  private readonly logger: Logger = new Logger(QuestionAnswerService.name);

  constructor(private prismaService: PrismaService) {}

  async createQuestion(
    userId: string,
    productId: string,
    createQuestion: CreateQuestionsDto
  ) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: {
          id: productId,
        },
      });
      if (!product) {
        throw new NotFoundException("Product not found!");
      }
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new NotFoundException("User does not found");
      }
      const question = await this.prismaService.questions.create({
        data: {
          ...createQuestion,
          productId,
          userId,
        },
      });
      return {
        message: "Question has been created successfully!",
        data: question,
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

  async createAnswer(
    vendorId: string,
    questionId: string,
    createAnswer: CreateAnswerDto
  ) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: {
          id: vendorId,
        },
      });
      if (!vendor) {
        throw new NotFoundException("Vendor does not found");
      }
      const answer = await this.prismaService.answers.create({
        data: {
          ...createAnswer,
          questionId,
          vendorId,
        },
      });
      return {
        message: "Answer has been created successfully!",
        data: answer,
      };
    } catch (error) {
      this.logger.error("Error creating answer", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getVendorQuestions(vendorId: string) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: {
          id: vendorId,
        },
      });
      if (!vendor) {
        throw new NotFoundException("Vendor does not found");
      }
      const questions = await this.prismaService.questions.findMany({
        where: {
          product: {
            vendorId
          }
        },
        include: {
          user: true,
          product: true,
          answers: {
            include: {
              vendor: true
            }
          },
        },
      });
      return {
        data: questions,
      };
    } catch (error) {
      this.logger.error("Error fetching vendor-related questions", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAllQuestions(productId: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: {
          id: productId,
        },
      });
      if (!product) {
        throw new NotFoundException("Product not found!");
      }
      const questions = await this.prismaService.questions.findMany({
        where: {
          productId,
        },
        include: {
          user: true,
          product: true,
          answers: {
            include: {
              vendor: true
            }
          },
        },
      });
      return {
        data: questions,
      };
    } catch (error) {
      this.logger.error("Error getting Questions", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateQuestion(
    userId: string,
    questionId: string,
    updateQuestion: UpdateQuestionsDto
  ) {
    try {
      const question = await this.prismaService.questions.findUnique({
        where: {
          id: questionId,
        },
      });
      if (!question) {
        throw new NotFoundException("Question not found!");
      }
      if (question.userId !== userId) {
        throw new ConflictException(
          "Sorry, you don't have access to perform this action!"
        );
      }

      if(typeof updateQuestion?.question === "string" && updateQuestion?.question.trim() === "") {
        throw new BadRequestException({
            message: "Question cannot be empty. Please provide a valid value.",
          });
      }

      const update = await this.prismaService.questions.update({
        where: {
          id: questionId,
        },
        data: updateQuestion,
      });
      return {
        message: "Question has been updated successfully!",
        data: update,
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

  async updateAnswer(
    vendorId: string,
    answerId: string,
    updateAnswer: UpdateAnswerDto
  ) {
    try {
      const answer = await this.prismaService.answers.findUnique({
        where: {
          id: answerId,
        },
      });
      if (!answer) {
        throw new NotFoundException("Answer not found!");
      }
      if (answer.vendorId !== vendorId) {
        throw new ConflictException(
          "Sorry, you don't have access to perform this action!"
        );
      }

      if(typeof updateAnswer?.reply === "string" && updateAnswer?.reply.trim() === "") {
        throw new BadRequestException({
            message: "Answer cannot be empty. Please provide a valid value.",
        });
      }
      const update = await this.prismaService.answers.update({
        where: {
          id: answerId,
        },
        data: updateAnswer,
      });
      return {
        message: "Answer has been updated successfully!",
        data: update,
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

  async deleteQuestion(userId: string, questionId: string) {
    try {
      const question = await this.prismaService.questions.findUnique({
        where: {
          userId,
          id: questionId,
        },
        include: {
          answers: true,
        }
      });
      if (!question) {
        throw new NotFoundException("Question not found!");
      }
      if (question.userId !== userId) {
        throw new ConflictException(
          "Sorry, you don't have access to perform this action!"
        );
      }
      if(question?.answers.length > 0) {
        throw new ConflictException(
          "Cannot delete question with associated answers!"
        );
      }
      await this.prismaService.questions.delete({
        where: {
          id: questionId,
        },
      });
      return {
        message: "Question has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error delete question", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteAnswer(vendorId: string, answerId: string) {
    const answer = await this.prismaService.answers.findUnique({
      where: {
        vendorId,
        id: answerId,
      },
    });
    if (!answer) {
      throw new NotFoundException("Answer not found!");
    }
    if (answer.vendorId !== vendorId) {
      throw new ConflictException(
        "Sorry, you don't have access to perform this action!"
      );
    }
    await this.prismaService.answers.delete({
      where: {
        id: answerId,
      },
    });
    return {
      message: "Answer has been deleted successfully!",
    };
  }
}
