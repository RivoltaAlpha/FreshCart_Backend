import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Enable CORS for specific origins
  app.enableCors({
    origin: [
      'http://localhost:8000',
      'http://localhost:5173',
      'https://fresh-cart-beta-hazel.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FreshCart API')
    .setDescription('API documentation for FreshCart')
    .setVersion('1.0')
    .addServer('http://localhost:8000', 'Local development server')
    .addServer(
      'https://redeployedinventory-dnd8gmc3a2a0dzcw.southafricanorth-01.azurewebsites.net',
      'Production server',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      docExpansion: 'none',
      customSiteTitle: 'FreshCart API Documentation',
    },
  });

  const configService = app.get(ConfigService);
  const PORT = configService.getOrThrow<number>('PORT');
  await app.listen(PORT, () => {
    console.log(`Application is running on port: ${PORT}`);
  });
}
bootstrap();
