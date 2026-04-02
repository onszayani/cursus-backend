import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ example: 'Fermeture de la bibliothèque' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'La bibliothèque sera fermée le 15 mars...' })
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({
    required: false,
    example: 'ING_A1_G1',
    description: 'null = pour tous',
  })
  @IsOptional()
  targetGroup?: string;
}
