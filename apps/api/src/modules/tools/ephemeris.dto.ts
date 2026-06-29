import { IsDateString, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BirthDetailsDto {
  @ApiProperty({ example: '1990-07-15' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: '14:30' })
  @IsString()
  birthTime!: string;

  @ApiProperty({ example: 'Delhi, India' })
  @IsString()
  birthPlace!: string;
}

export class PlanetaryPositionsDto extends BirthDetailsDto {}
export class NakshatraDto extends BirthDetailsDto {}
export class RashiDto extends BirthDetailsDto {}
export class LagnaDto extends BirthDetailsDto {}
export class DashaDto extends BirthDetailsDto {}
export class MangalDoshaDto extends BirthDetailsDto {}
export class BirthChartDto extends BirthDetailsDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  name?: string;
}

export class PersonDetailsDto extends BirthDetailsDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;
}

export class KundaliMatchingDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PersonDetailsDto)
  person1!: PersonDetailsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PersonDetailsDto)
  person2!: PersonDetailsDto;
}

export class AyanamsaDto {
  @ApiProperty({ example: '1990-07-15' })
  @IsDateString()
  birthDate!: string;
}
