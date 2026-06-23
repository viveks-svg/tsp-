import { Module } from "@nestjs/common";
import { AstrologersService } from "./astrologers.service";
import { AstrologersController } from "./astrologers.controller";

@Module({
  controllers: [AstrologersController],
  providers: [AstrologersService],
  exports: [AstrologersService],
})
export class AstrologersModule {}
