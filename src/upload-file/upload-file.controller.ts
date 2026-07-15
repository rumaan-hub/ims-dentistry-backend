import {
  Controller,
  UseInterceptors,
  UploadedFile,
  Post,
  Delete,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";

import { UploadFileService } from "./upload-file.service";
@Controller("upload-file")
export class UploadFileController {
  constructor(private readonly uploadFileService: UploadFileService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadFileService.uploadFile(file);
  }

  /** DELETE /upload-file?url=https://bucket.s3.amazonaws.com/documents/... */
  @Delete()
  deleteFile(@Query("url") url: string) {
    if (!url) throw new BadRequestException("url query param is required");
    let key: string;
    try {
      key = new URL(url).pathname.slice(1); // "documents/uuid-filename"
    } catch {
      throw new BadRequestException("Invalid file URL");
    }
    return this.uploadFileService.deleteFile(key);
  }
}
