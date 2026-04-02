import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty()
  @IsString()
  titre: string;

  @ApiProperty()
  @IsString()
  contenu: string;
}
