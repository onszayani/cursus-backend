import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    example: 'Bonjour @technicien, le datashow de la salle A2 est en panne.',
    description:
      'Contenu du message. Utilisez @username, @role, @GROUPE, @tous',
  })
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  attachmentUrl?: string;

  @ApiProperty({
    required: false,
    description: 'ID du message auquel on répond',
  })
  @IsOptional()
  replyToId?: string;
}
