import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation automatique de tous les DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignore les champs non déclarés dans le DTO
      transform: true, // convertit les types automatiquement
      forbidNonWhitelisted: true,
    }),
  );

  // CORS — autoriser le frontend à appeler l'API
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ISSAT Cursus API')
    .setDescription('Backend — Gestion du cursus universitaire ISSAT Sousse')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

<<<<<<< HEAD
  const port = process.env.PORT ?? 3001;
=======
  const port = process.env.PORT ?? 3001;
>>>>>>> 0b646a53e00b24d9972a4cbdb7212703c9569b0e
  await app.listen(port);
  console.log(`API: http://localhost:${port}`);
  console.log(`Docs Swagger: http://localhost:${port}/api/docs`);
}
void bootstrap();
