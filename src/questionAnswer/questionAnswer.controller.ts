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
import { CreateQuestionsDto } from "./dto/create-questions.dto";
import { QuestionAnswerService } from "./questionAnswer.service";
import { CreateAnswerDto } from "./dto/create-answer.dto";
import { UpdateAnswerDto } from "./dto/update-answer.dto";
import { UpdateQuestionsDto } from "./dto/update-questions.dto";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Roles } from "src/user/role/role.decorator";
import { Role } from "src/user/role/role.enum";

@Controller("questionAnswers")
export class QuestionAnswerController {
  constructor(private readonly questionAnswer: QuestionAnswerService) {}

  @UseGuards(JwtGuard)
  @Post("user/:userId/product/:productId/create")
  createQuestion(
    @Param("userId") userId: string,
    @Param("productId") productId: string,
    @Body() createCategory: CreateQuestionsDto
  ) {
    return this.questionAnswer.createQuestion(userId, productId, createCategory);
  }

  @UseGuards(JwtGuard)
  @Post("vendor/:vendorId/question/:questionId")
  createAnswer(
    @Param("vendorId") vendorId: string,
    @Param("questionId") questionId: string,
    @Body() createAnswer: CreateAnswerDto
  ) {
    return this.questionAnswer.createAnswer(vendorId, questionId, createAnswer);
  }

  @Get("product/:productId")
  getAllQuestions(
    @Param("productId") productId: string
  ) {
    return this.questionAnswer.getAllQuestions(productId);
  }

  @UseGuards(JwtGuard)
  @Get("vendor/:vendorId")
  getVendorQuestions(@Param("vendorId") vendorId: string) {
    return this.questionAnswer.getVendorQuestions(vendorId);
  }

  @UseGuards(JwtGuard)
  @Put("user/:userId/question/:questionId/update")
  updateQuestion(
    @Param("userId") userId: string,
    @Param("questionId") questionId: string,
    @Body() updateQuestionsData: UpdateQuestionsDto
  ) {
    return this.questionAnswer.updateQuestion(userId, questionId, updateQuestionsData);
  }

  @UseGuards(JwtGuard)
  @Put("vendor/:vendorId/answer/:answerId/update")
  updateAnswer(
    @Param("vendorId") vendorId: string,
    @Param("answerId") answerId,
    @Body() updateAnswer: UpdateAnswerDto
  ) {
    return this.questionAnswer.updateAnswer(vendorId, answerId, updateAnswer);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER, Role.VENDOR)
  @Delete("user/:userId/question/:questionId/delete")
  deleteQuestion(
    @Param("userId") userId: string,
    @Param("questionId") questionId: string
  ) {
    return this.questionAnswer.deleteQuestion(userId, questionId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER, Role.VENDOR)
  @Delete("vendor/:vendorId/answer/:answerId/delete")
  deleteAnswer(
    @Param("vendorId") vendorId: string,
    @Param("answerId") answerId: string
  ) {
    return this.questionAnswer.deleteAnswer(vendorId, answerId);
  }
}
