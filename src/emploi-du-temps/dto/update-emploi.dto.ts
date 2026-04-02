import { PartialType } from '@nestjs/swagger';
import { CreateEmploiDto } from './create-emploi.dto';

export class UpdateEmploiDto extends PartialType(CreateEmploiDto) {}
