import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://votre-domaine.com']
        : '*',
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Dossiers statiques pour les uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Cursus Universitaire API')
    .setDescription(
      'API pour la gestion du cursus universitaire, forum et notifications',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('emploi-du-temps', 'Gestion des emplois du temps')
    .addTag('support-cours', 'Gestion des supports de cours')
    .addTag('actualites', 'Gestion des actualités')
    .addTag('groupes', 'Gestion des groupes')
    .addTag('forum', 'Forum de discussion')
    .addTag('notifications', 'Gestion des notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api-docs`,
  );
}
void bootstrap();
