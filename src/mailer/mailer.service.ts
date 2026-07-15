import {
  BadGatewayException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { exceptionHandler } from "src/utils/error-handler.util";

@Injectable()
export class MailerService {
  private transporter;
  private readonly logger: Logger = new Logger(MailerService.name);
  private readonly normalizedEmailUser: string;

  constructor(private configService: ConfigService) {
    // const emailUser = this.configService.get<string>("EMAIL_USER");
    // const emailPassword = this.configService.get<string>("EMAIL_PASSWORD");
    const emailUser = (this.configService.get<string>("EMAIL_USER") || "").trim();
    const emailPassword = (this.configService.get<string>("EMAIL_PASSWORD") || "").trim();
    const mailService = this.configService.get<string>("EMAIL_SERVICE");
    this.normalizedEmailUser = emailUser;
    this.transporter = nodemailer.createTransport({
      service: mailService,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        // from: `${this.configService.get<string>("EMAIL_PLATFORM")}${ "<" + this.configService.get<string>("EMAIL_USER") + ">"}`,
        from: `${this.configService.get<string>("EMAIL_PLATFORM")}${ "<" + this.normalizedEmailUser + ">"}`,
        to,
        subject,
        html,
      });
      return;
    } catch (error) {
      this.logger.error("Error sending email", error);
      const responseCode = error?.responseCode;
      const responseText = error?.response || error?.message || "Unknown SMTP error";
      const normalizedResponse = String(responseText).toLowerCase();

      if (
        responseCode === 535 ||
        normalizedResponse.includes("badcredentials") ||
        normalizedResponse.includes("invalid login")
      ) {
        throw new BadGatewayException(
          "SMTP authentication failed. Update EMAIL_USER/EMAIL_PASSWORD (for Gmail, use a 16-character App Password)."
        );
      }

      throw exceptionHandler(error);
    }
  }
}
