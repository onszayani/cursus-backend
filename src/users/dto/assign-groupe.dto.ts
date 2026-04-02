import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class AssignGroupeDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  groupeId: string;
}

export class AssignMultipleGroupesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  groupeIds: string[];
}
