import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveDetailsDto {
  @ApiProperty({ description: 'Form data as a JSON object — merged with existing data' })
  @IsObject()
  formData!: Record<string, any>;
}
