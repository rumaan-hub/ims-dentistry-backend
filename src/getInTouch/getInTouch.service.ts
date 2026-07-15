import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { CreateGetInTouchDto } from "./dto/create-getInTouch.dto";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "src/mailer/mailer.service";

@Injectable()
export class GetInTouchService {
  private readonly logger: Logger = new Logger(GetInTouchService.name);

  constructor(
    private prismaService: PrismaService,
    private emailService: MailerService,
    private configService: ConfigService
  ) {}

  async createGetInTouch(
    userId: string,
    createGetInTouch: CreateGetInTouchDto
  ) {
    try {
      const getInTouchCreate = await this.prismaService.getInTouch.create({
        data: {
          ...createGetInTouch,
          userId : userId ?? null,
        },
      });
      await this.emailService.sendEmail(
        this.configService.get<string>("EMAIL_USER"),
        createGetInTouch.subject,
        `
        <div>
        <p>User email: ${createGetInTouch.email}</p>
        <p>Message: ${createGetInTouch.message}</p>
        </div>
        `,
      );
      return {
        message: "Your query submitted successfully!",
        data: getInTouchCreate,
      };
    } catch (error) {
      this.logger.error("Error on query submit", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
