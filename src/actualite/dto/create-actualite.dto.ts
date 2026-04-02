import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateActualiteDto {
  @ApiProperty()
  @IsString()
  titre: string;

  @ApiProperty()
  @IsString()
  contenu: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cible?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateExpiration?: string;
}
