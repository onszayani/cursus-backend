/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // GET /schedule  → retourne le bon emploi du temps selon le rôle
  @Get()
  @ApiOperation({ summary: 'Mon emploi du temps (adapté au rôle)' })
  getMySchedule(@CurrentUser() user: any) {
    if (user.role === 'student')
      return this.scheduleService.findByGroup(user.studentGroup);
    if (user.role === 'teacher')
      return this.scheduleService.findByTeacher(user.id);
    return this.scheduleService.findAll(); // admin/agent
  }

  // GET /schedule/group/:group
  @Get('group/:group')
  @Roles('admin')
  @ApiOperation({ summary: "Emploi du temps d'un groupe" })
  findByGroup(@Param('group') group: string) {
    return this.scheduleService.findByGroup(group);
  }

  // GET /schedule/teacher/:teacherId
  @Get('teacher/:teacherId')
  @ApiOperation({ summary: "Emploi du temps d'un enseignant" })
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.scheduleService.findByTeacher(teacherId);
  }

  // POST /schedule  (admin uniquement)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Créer un créneau (admin)' })
  create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  // PATCH /schedule/:id  (admin uniquement)
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Modifier un créneau (admin)' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateScheduleDto>) {
    return this.scheduleService.update(id, dto);
  }

  // DELETE /schedule/:id  (admin uniquement)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer un créneau (admin)' })
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
