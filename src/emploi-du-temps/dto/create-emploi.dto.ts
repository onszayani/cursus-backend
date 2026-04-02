import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateEmploiDto {
  @ApiProperty()
  @IsUUID()
  groupeId: string;

  @ApiProperty()
  @IsUUID()
  coursId: string;

  @ApiProperty({ example: 'Lundi' })
  @IsString()
  jour: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  heureDebut: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  heureFin: string;

  @ApiProperty({ example: 'Salle A101' })
  @IsString()
  salle: string;

  @ApiProperty({ example: 'Cours' })
  @IsString()
  type: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(52)
  semaine: number;
}
