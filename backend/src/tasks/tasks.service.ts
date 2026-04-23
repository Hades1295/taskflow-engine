import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Task, TaskDocument } from "./schema/task.schema";
import { Model } from "mongoose";

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async createBulk(dto: any) {
    const sourceTasks = dto?.parsed?.tasks || dto?.tasks || [];

    let currentDate = new Date();
    let sprintCounter = 1;

    const tasks = sourceTasks.map((task, index) => {
      const subtasks = (task.subtasks || []).map((sub) => ({
        ...sub,
        status: "TODO",
      }));

      const totalHours =
        subtasks.length > 0
          ? subtasks.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)
          : task.estimatedHours || 0;

      if (index % 5 === 0 && index !== 0) sprintCounter++;

      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + Math.ceil(totalHours / 6)); // 6 hrs/day

      return {
        projectId: dto.projectId,
        projectName: dto.projectName,
        title: task.title,
        description: task.description,
        priority: task.priority || "MEDIUM",
        estimatedHours: task.estimatedHours || 0,
        totalHours,
        status: "TODO",
        assignedTo: null,
        sprint: `Sprint ${sprintCounter}`,
        startDate,
        endDate,
        subtasks,
      };
    });

    return this.taskModel.insertMany(tasks);
  }

  async updateTask(id: string, updateData: any) {
    return this.taskModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }

  async deleteByProject(projectId: string) {
    return this.taskModel.deleteMany({ projectId });
  }

  async findAll() {
    return this.taskModel.find();
  }

  async findByProject(projectId: string) {
    return this.taskModel.find({ projectId });
  }

  async findBySprint(sprint: string) {
    return this.taskModel.find({ sprint });
  }
}
