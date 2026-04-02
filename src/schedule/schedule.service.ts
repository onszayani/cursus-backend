import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  // Emploi du temps d'un groupe (pour les étudiants)
  findByGroup(studentGroup: string) {
    return this.prisma.schedule.findMany({
      where: { studentGroup },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  // Emploi du temps d'un enseignant
  findByTeacher(teacherId: string) {
    return this.prisma.schedule.findMany({
      where: { teacherId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  // Tous les emplois du temps (admin)
  findAll() {
    return this.prisma.schedule.findMany({
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // Créer un créneau
  create(dto: CreateScheduleDto) {
    return this.prisma.schedule.create({ data: dto });
  }

  // Modifier un créneau
  async update(id: string, dto: Partial<CreateScheduleDto>) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Créneau non trouvé');
    return this.prisma.schedule.update({ where: { id }, data: dto });
  }

  // Supprimer un créneau
  async remove(id: string) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Créneau non trouvé');
    return this.prisma.schedule.delete({ where: { id } });
  }
}
