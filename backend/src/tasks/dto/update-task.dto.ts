export class UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  estimatedHours?: number;
}
