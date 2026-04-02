import { IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ example: 'Algorithmique' })
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Salle A1' })
  @IsNotEmpty()
  room: string;

  @ApiProperty({ example: 0, description: '0=Lundi, 1=Mardi ... 4=Vendredi' })
  @IsInt()
  @Min(0)
  @Max(4)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00' })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '10:00' })
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'ING_A1_G1' })
  @IsNotEmpty()
  studentGroup: string;

  @ApiProperty({ example: 'S1', required: false })
  @IsOptional()
  semester?: string;

  @ApiProperty({
    example: 'cours',
    required: false,
    description: 'cours | td | tp',
  })
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'uuid-enseignant', required: false })
  @IsOptional()
  teacherId?: string;
}
