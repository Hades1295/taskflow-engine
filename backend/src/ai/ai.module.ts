import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { TasksModule } from "../tasks/tasks.module";
import { ConfigModule } from "@nestjs/config";
import { AiController } from "./ai.controller";
@Module({
  imports: [TasksModule, ConfigModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
