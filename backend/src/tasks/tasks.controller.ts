import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getAll() {
    return this.tasksService.findAll();
  }

  @Get("project/:projectId")
  getByProject(@Param("projectId") projectId: string) {
    return this.tasksService.findByProject(projectId);
  }

  @Patch(":id")
  updateTask(@Param("id") id: string, @Body() body: any) {
    return this.tasksService.updateTask(id, body);
  }

  @Patch(":id/assign")
  assignUser(@Param("id") id: string, @Body() body: { user: string }) {
    return this.tasksService.updateTask(id, {
      assignedTo: body.user,
    });
  }

  @Post("bulk")
  createBulk(@Body() body: any) {
    return this.tasksService.createBulk(body);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.tasksService.updateTask(id, {
      status: body.status,
    });
  }

  @Get("sprint/:sprint")
  getBySprint(@Param("sprint") sprint: string) {
    return this.tasksService.findBySprint(sprint);
  }
}
