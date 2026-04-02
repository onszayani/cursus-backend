import { Module } from '@nestjs/common';
import { EmploiDuTempsService } from './emploi-du-temps.service';
import { EmploiDuTempsController } from './emploi-du-temps.controller';

@Module({
  controllers: [EmploiDuTempsController],
  providers: [EmploiDuTempsService],
  exports: [EmploiDuTempsService],
})
export class EmploiDuTempsModule {}
