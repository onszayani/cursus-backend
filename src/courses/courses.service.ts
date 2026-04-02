/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import * as fs from 'fs';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // Supports accessibles à l'utilisateur
  findForUser(user: any, subject?: string) {
    const where: any = {};
    if (user.role === 'student') {
      where.OR = [{ targetGroup: user.studentGroup }, { targetGroup: 'all' }];
    } else if (user.role === 'teacher') {
      where.teacherId = user.id;
    }
    if (subject) where.subject = subject;
    return this.prisma.courseMaterial.findMany({
      where,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  create(dto: CreateMaterialDto, teacherId: string, file: Express.Multer.File) {
    return this.prisma.courseMaterial.create({
      data: {
        ...dto,
        teacherId,
        fileName: file.originalname,
        filePath: file.path,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const mat = await this.prisma.courseMaterial.findUnique({ where: { id } });
    if (!mat) throw new NotFoundException('Support non trouvé');
    if (mat.teacherId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Accès interdit');
    }
    // Supprimer le fichier physique
    if (fs.existsSync(mat.filePath)) fs.unlinkSync(mat.filePath);
    return this.prisma.courseMaterial.delete({ where: { id } });
  }
}
