import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AppConfigService } from '../services/config/config.service';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { exceptionHandler, handlePrismaError } from 'src/utils/error-handler.util';

@Injectable()
export class UploadFileService {
    private readonly logger: Logger = new Logger(UploadFileService.name);
    private s3Client: S3Client;
    private readonly region: string;
    private readonly bucketName: string;
    private readonly accessKeyId: string;
    private readonly secretAccessKey: string;
  
    constructor(
      private configService: AppConfigService,
    ) {
      const { bucketName, region, accessKeyID, secretAccessKey } = this.configService.getS3BucketConfigs();
      this.region = region;
      this.bucketName = bucketName;
      this.accessKeyId = accessKeyID;
      this.secretAccessKey = secretAccessKey;
  
      this.s3Client = new S3Client({
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
        region: this.region,
      });
    }

  async uploadFile(file): Promise<any> {
    if (!file) throw new BadRequestException('No file found');

    const { buffer, originalname } = file;
    try {
      const base64data = buffer;
      const key = `documents/${uuid()}-${originalname}`;
      const uploadResult = await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Body: base64data,
        Key: key,
      }));

      const { ETag, ServerSideEncryption } = uploadResult;
      const Bucket = this.bucketName;
      const Location = `https://${Bucket}.s3.amazonaws.com/${key}`;

      return { ETag, ServerSideEncryption, Location, key, Key: key, Bucket };
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteFile(fileKey): Promise<any> {
    try {
      const deletedFile = await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        })
      );

      return deletedFile;
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
