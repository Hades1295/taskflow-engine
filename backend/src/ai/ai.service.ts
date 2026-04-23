import { BadRequestException, Injectable } from "@nestjs/common";
import axios from "axios";
import { TasksService } from "../tasks/tasks.service";
import { randomUUID } from "crypto";
import * as mammoth from "mammoth";
import FormData from "form-data";
import { ConfigService } from "@nestjs/config";
const pdfParse = require("pdf-parse");

@Injectable()
export class AiService {
  constructor(
    private readonly tasksService: TasksService,
    private readonly configService: ConfigService,
  ) {}

  async processFile(file: Express.Multer.File) {
    const mime = file.mimetype;
    let text = "";

    if (mime.startsWith("image/")) {
      text = await this.extractFromImage(file);
    } else if (mime === "application/pdf") {
      text = await this.extractFromPDF(file);
    } else if (
      mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await this.extractFromDocx(file);
    } else if (mime === "text/plain") {
      text = this.extractFromTxt(file);
    } else {
      throw new BadRequestException(`Unsupported file type: ${mime}`);
    }

    // 🔥 CRITICAL: Validate text quality
    if (!text || text.length < 100) {
      throw new BadRequestException("Failed to extract meaningful text");
    }

    // ✨ AI-OPTIMIZED: Add metadata for better context
    const metadata = this.extractMetadata(text);

    return {
      text,
      metadata, // Include document type, sections, etc.
      charCount: text.length,
      wordCount: text.split(/\s+/).length,
    };
  }

  // 🆕 Extract metadata for AI context
  private extractMetadata(text: string) {
    const lines = text.split("\n");

    return {
      documentType: this.detectDocumentType(text),
      sections: this.extractSections(text),
      hasStructure: /^\d+\.|^-\s|^•\s/m.test(text),
      fileName: "BRD.txt", // You can get this from file.originalname
    };
  }

  private detectDocumentType(text: string): string {
    if (/business requirements document|brd/i.test(text)) return "BRD";
    if (/technical specification|spec/i.test(text)) return "Technical Spec";
    if (/user story|user stories/i.test(text)) return "User Stories";
    return "General Document";
  }

  private extractSections(text: string): string[] {
    const sections: string[] = [];
    const matches = text.matchAll(/^(\d+\.?\s+[A-Z][^\n]+)$/gm);

    for (const match of matches) {
      sections.push(match[1].trim());
    }

    return sections;
  }

  extractFromTxt(file: Express.Multer.File): string {
    let text = file.buffer.toString("utf-8");

    // 🔥 Handle JSON string input
    try {
      text = JSON.parse(text);
    } catch {}

    return (
      text
        // ✅ Fix escaped newlines
        .replace(/\\n/g, "\n")

        // ✅ Normalize line breaks
        .replace(/\r/g, "")

        // ✅ Fix bullet points formatting
        .replace(/-\s+/g, "\n- ")

        // ✅ Ensure section spacing
        .replace(/\n?\d+\.\s+/g, (match) => `\n\n${match}`)

        // ✅ Remove ONLY problematic unicode (keep useful ones)
        .replace(/═+/g, "")
        .replace(/…/g, "")

        // ✅ Collapse excessive spaces
        .replace(/[ \t]+/g, " ")

        // ✅ Normalize paragraphs
        .replace(/\n{3,}/g, "\n\n")

        .trim()
    );
  }

  async extractFromImage(file: Express.Multer.File): Promise<string> {
    const formData = new FormData();
    formData.append("apikey", "helloworld");
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    const parsed = response.data?.ParsedResults?.[0]?.ParsedText;

    if (!parsed) throw new Error("OCR failed");

    return parsed;
  }

  async extractFromPDF(file: Express.Multer.File): Promise<string> {
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  async extractFromDocx(file: Express.Multer.File): Promise<string> {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });

    return result.value;
  }

  async processBRD(parsed: any) {
    const projectId = parsed.projectId || randomUUID();

    if (!parsed?.tasks?.length) {
      throw new BadRequestException("Invalid task payload");
    }

    await this.tasksService.createBulk({
      projectId,
      projectName: parsed.projectName || "Generated Project",
      tasks: parsed.tasks,
    });

    return {
      projectId,
      message: "Tasks stored successfully",
    };
  }

  async refineTasks(instruction: string) {
    const tasks = await this.tasksService.findAll();

    if (!tasks.length) {
      throw new BadRequestException("No tasks found to refine");
    }

    const projectId = tasks[0].projectId;
    const projectName = tasks[0].projectName;

    const updatedTasks = tasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: instruction.toLowerCase().includes("high")
        ? "HIGH"
        : t.priority,
      estimatedHours: t.estimatedHours,
      subtasks: t.subtasks || [],
    }));

    await this.tasksService.deleteByProject(projectId);

    await this.tasksService.createBulk({
      projectId,
      projectName,
      tasks: updatedTasks,
    });

    return {
      projectId,
      projectName,
      tasks: updatedTasks,
    };
  }

  async uploadAndGenerate(file: Express.Multer.File) {
    const { text } = await this.processFile(file);

    const webhookUrl = this.configService.get<string>(
      "N8N_WEBHOOK_PROCESSBRD_URL",
    );

    if (!webhookUrl) {
      throw new Error("N8N_WEBHOOK_URL is not defined");
    }

    const aiResponse = await axios.post(webhookUrl, {
      text: text,
    });
    console.log(aiResponse);
    let parsed;

    try {
      let raw = aiResponse.data;

      if (raw.output) raw = raw.output;

      if (typeof raw === "string") {
        raw = raw.trim();

        if (raw.startsWith('"') && raw.endsWith('"')) {
          raw = raw.slice(1, -1);
        }

        raw = raw.replace(/\\"/g, '"');

        parsed = JSON.parse(raw);
      } else {
        parsed = raw[0];
      }
    } catch (e) {
      throw new BadRequestException("Failed to parse AI response");
    }

    if (!parsed?.tasks?.length) {
      throw new BadRequestException("Invalid AI response");
    }

    const projectId = randomUUID();

    await this.tasksService.createBulk({
      projectId,
      projectName: parsed.projectName || "Generated Project",
      tasks: parsed.tasks,
    });

    return {
      projectId,
      projectName: parsed.projectName,
      tasksCreated: parsed.tasks.length,
      tasks: parsed.tasks,
      message: "Tasks generated and stored successfully",
    };
  }
}
