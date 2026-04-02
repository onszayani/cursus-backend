import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ example: "Cours 1 — Introduction à l'algorithmique" })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Algorithmique' })
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: 'ING_A1_G1',
    description: "'all' pour tous les groupes",
  })
  @IsNotEmpty()
  targetGroup: string;

  @ApiProperty({ example: 'S1', required: false })
  @IsOptional()
  semester?: string;
}
