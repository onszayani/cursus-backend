import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  student = 'student',
  teacher = 'teacher',
  agent = 'agent',
  admin = 'admin',
}
export enum AgentType {
  agent_administratif = 'agent_administratif',
  technicien = 'technicien',
  responsable_labo = 'responsable_labo',
  bibliothecaire = 'bibliothecaire',
  securite = 'securite',
  autre = 'autre',
}

export class RegisterDto {
  @ApiProperty({ example: 'ahmed@issat.tn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasse123', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Ben Ali' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'Ahmed_Ben',
    description: 'Utilisé pour les @mentions',
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({ enum: UserRole, example: 'student' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ enum: AgentType, required: false })
  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @ApiProperty({ example: 'ING_A1_G1', required: false })
  @IsOptional()
  studentGroup?: string;

  @ApiProperty({ example: 'informatique', required: false })
  @IsOptional()
  department?: string;
}
