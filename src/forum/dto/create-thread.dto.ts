import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MentionType } from '@prisma/client';

export class CreateThreadDto {
  @ApiProperty({
    example: 'Problème datashow salle A2',
    description: 'Titre du thread',
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    enum: MentionType,
    example: 'ROLE',
    description: 'Type de destinataire: ALL, ROLE, GROUP, USER',
  })
  @IsNotEmpty()
  @IsIn(['ALL', 'ROLE', 'GROUP', 'USER'])
  receiverType!: MentionType;

  @ApiProperty({
    example: 'technicien',
    description:
      'Valeur du destinataire: tous, technicien, ING_A1_G1, Ahmed_Ben',
  })
  @IsNotEmpty()
  @IsString()
  receiverValue!: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Thread privé (seuls les participants voient les messages)',
  })
  @IsOptional()
  isPrivate?: boolean;
}
