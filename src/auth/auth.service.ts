/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── REGISTER ───────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Vérifier si l'email ou username est déjà pris
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) throw new ConflictException('Email ou username déjà utilisé');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        role: dto.role as any,
        agentType: (dto.agentType as any) ?? null,
        studentGroup: dto.studentGroup ?? null,
        department: dto.department ?? null,
      },
    });

    return this.buildTokenResponse(user);
  }

  // ── LOGIN ──────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Identifiants invalides');

    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    return this.buildTokenResponse(user);
  }

  // ── GET PROFILE ────────────────────────────────────────────────────
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
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
        createdAt: true,
      },
    });
  }

  // ── HELPER ─────────────────────────────────────────────────────────
  private buildTokenResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwt.sign(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN'),
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        agentType: user.agentType,
        studentGroup: user.studentGroup,
        department: user.department,
      },
    };
  }
}
