import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}
}
