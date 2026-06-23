import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}
}
