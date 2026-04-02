import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  controllers: [NewsController],
  providers: [NewsService], // ← vérifiez que cette ligne est présente
})
export class NewsModule {}
