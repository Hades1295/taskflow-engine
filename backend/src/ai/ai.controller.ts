import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { AiService } from "./ai.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("process-brd")
  async processBRD(@Body() body: { brd: string }) {
    return this.aiService.processBRD(body);
  }

  @Post("refine")
  refineTasks(@Body() body: { instruction: string }) {
    return this.aiService.refineTasks(body.instruction);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadBRD(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    return this.aiService.processFile(file);
  }

  @Post("upload-and-generate")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAndGenerate(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    return this.aiService.uploadAndGenerate(file);
  }
}
