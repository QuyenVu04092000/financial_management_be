import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const defaultVersion = configService.get('DEFAULT_VERSION');
  const port = configService.get('PORT');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: defaultVersion,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use(morgan('dev'));

  await app.listen(port || 3080);
}
bootstrap();
