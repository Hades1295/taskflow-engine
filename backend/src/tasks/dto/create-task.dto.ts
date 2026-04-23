export class CreateTaskDto {
  projectName: string;
  projectId: string;
  tasks: {
    title: string;
    description: string;
    priority: string;
    estimatedHours: number;
  }[];
}
