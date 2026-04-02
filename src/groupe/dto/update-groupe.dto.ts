import { PartialType } from '@nestjs/swagger';
import { CreateGroupeDto } from './create-groupe.dto';

export class UpdateGroupeDto extends PartialType(CreateGroupeDto) {}
