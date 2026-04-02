/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Successfully disconnected from the database');
    } catch (error) {
      this.logger.error('Failed to disconnect from the database:', error);
      throw error;
    }
  }

  /**
   * Nettoie la base de données (utile pour les tests)
   * Supprime toutes les données des tables dans le bon ordre pour éviter les contraintes de clés étrangères
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be called in test environment');
    }

    const tablenames = (await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`) as Array<{
      tablename: string;
    }>;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations');

    try {
      const truncateQueries: Promise<number>[] = tables.map(
        (table: string) =>
          this.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${table}" CASCADE;`,
          ) as Promise<number>,
      );
      await this.$transaction(async (prisma) => {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        await (prisma as PrismaClient)
          .$executeRaw`SET session_replication_role = 'replica';`;
        await Promise.all(truncateQueries);
        await (prisma as PrismaClient)
          .$executeRaw`SET session_replication_role = 'origin';`;
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      });
      this.logger.log('Database cleaned successfully');
    } catch (error) {
      this.logger.error('Failed to clean database:', error);
      throw error;
    }
  }
}
