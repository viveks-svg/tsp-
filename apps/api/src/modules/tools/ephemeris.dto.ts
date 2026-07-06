import { IsDateString, IsString, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsPastDate, IsNotPurelyNumeric } from '../../common/decorators/validation.decorator';

export class BirthDetailsDto {
  @ApiProperty({ example: '1990-07-15' })
  @IsDateString()
  @IsPastDate()
  birthDate!: string;

  @ApiProperty({ example: '14:30' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "birthTime must be in HH:MM 24-hour format" })
  birthTime!: string;

  @ApiProperty({ example: 'Delhi, India' })
  @IsString()
  @IsNotPurelyNumeric()
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
  @Matches(/^[a-zA-Z\s]+$/, { message: "Name must contain only letters and spaces" })
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
