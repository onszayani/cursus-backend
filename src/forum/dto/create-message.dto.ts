import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  contenu: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
