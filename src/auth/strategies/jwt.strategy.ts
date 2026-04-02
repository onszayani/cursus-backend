/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }): Promise<{
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    agentType: string | null;
    estActif: boolean;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        agentType: true,
        estActif: true,
      },
    }) as { id: string; email: string; nom: string; prenom: string; role: string; agentType: string | null; estActif: boolean } | null;

    if (!user || !user.estActif) {
      return null;
    }

    return user;
  }
}