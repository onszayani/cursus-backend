import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    example: 'Bonjour, le datashow de la salle A2 est en panne.',
    description: 'Contenu du message',
  })
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({
    required: false,
    description: 'ID du message auquel on répond',
  })
  @IsOptional()
  @IsString()
  replyToId?: string;
}
