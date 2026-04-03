/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { equals } from 'class-validator';

// Sélecteur sécurisé — exclut le mot de passe et le refreshToken
const SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  username: true,
  role: true,
  agentType: true,
  studentGroup: true,
  department: true,
  profilePicture: true,
  isActive: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Tous les utilisateurs (sans mdp)
  findAll() {
    return this.prisma.user.findMany({ select: SAFE_SELECT });
  }

  // Un utilisateur par ID
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  // Recherche par username (pour autocomplétion des @mentions)
  searchByUsername(query: string) {
    return this.prisma.user.findMany({
      where: { username: { contains: query, mode: 'insensitive' } },
      select: SAFE_SELECT,
      take: 10,
    });
  }
  // Trouver par username exact (pour résoudre @Ahmed_Ben)
  findByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });
  }

  // Tous les users d'un groupe/classe (@ING_A1_G1)
  findByGroup(studentGroup: string) {
    return this.prisma.user.findMany({ where: { studentGroup } });
  }

  // Tous les users d'un rôle (@admin, @enseignant...)
  findByRole(role: string) {
    return this.prisma.user.findMany({ where: { role: role as any } });
  }

  // Tous les agents d'un sous-type (@technicien, @responsable_labo...)
  findByAgentType(agentType: string) {
    return this.prisma.user.findMany({
      where: { agentType: agentType as any },
    });
  }

  // Tous les utilisateurs actifs (pour @tous)
  findAllActive() {
    return this.prisma.user.findMany({ where: { isActive: true } });
  }

  // Modifier son profil
  async updateProfile(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      profilePicture?: string;
      department?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
  }

  // Admin — activer/désactiver un utilisateur
  //   toggleActive(id: string, isActive: boolean) {
  //     return this.prisma.user.update({
  //       where: { id },
  //       data: { isActive },
  //       select: SAFE_SELECT,
  //     });
  //   }
}
