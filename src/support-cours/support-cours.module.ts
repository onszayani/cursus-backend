import { Module } from '@nestjs/common';
import { SupportCoursService } from './support-cours.service';
import { SupportCoursController } from './support-cours.controller';

@Module({
  controllers: [SupportCoursController],
  providers: [SupportCoursService],
  exports: [SupportCoursService],
})
export class SupportCoursModule {}
