import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateGroupeDto {
  @ApiProperty({ example: 'ING_A1_G1' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'ING1' })
  @IsString()
  niveau: string;

  @ApiProperty({ example: 'Informatique' })
  @IsString()
  specialite: string;

  @ApiProperty({ example: '2025/2026' })
  @IsString()
  anneeScolaire: string;
}
