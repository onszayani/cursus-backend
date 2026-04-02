/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Role, AgentType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'etudiant@issatso.rnu.tn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  prenom: string;

  @ApiProperty({ enum: Role, example: 'ETUDIANT' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ enum: AgentType, required: false })
  @IsEnum(AgentType)
  @IsOptional()
  agentType?: AgentType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telephone?: string;
}
