/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role, AgentType } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  prenom?: string;

  @ApiProperty({ enum: Role, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ enum: AgentType, required: false })
  @IsEnum(AgentType)
  @IsOptional()
  agentType?: AgentType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  photo?: string;
}
