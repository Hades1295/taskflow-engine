import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TaskDocument = Task & Document;

@Schema({ _id: false })
export class Subtask {
  @Prop() title: string;
  @Prop() description: string;
  @Prop() estimatedHours: number;

  @Prop({ default: "TODO", enum: ["TODO", "IN_PROGRESS", "DONE"] })
  status: string;
}

const SubtaskSchema = SchemaFactory.createForClass(Subtask);

@Schema({ timestamps: true })
export class Task {
  @Prop() projectId: string;

  @Prop() projectName: string;

  @Prop() title: string;

  @Prop() description: string;

  @Prop({ enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" })
  priority: string;

  @Prop({ default: 0 })
  estimatedHours: number;

  @Prop({ default: 0 })
  totalHours: number;

  @Prop({ default: "TODO", enum: ["TODO", "IN_PROGRESS", "DONE"] })
  status: string;

  @Prop() assignedTo: string;

  @Prop() sprint: string; // e.g. "Sprint 1"

  @Prop() startDate: Date;

  @Prop() endDate: Date;

  @Prop({ type: [SubtaskSchema], default: [] })
  subtasks: Subtask[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
