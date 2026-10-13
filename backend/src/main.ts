import 'dotenv/config'; // 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

import * as dns from 'dns';

async function bootstrap() {
  dns.setDefaultResultOrder('ipv4first');
  const app = await NestFactory.create(AppModule);
  
  app.enableCors(); 
  app.useGlobalPipes(new ValidationPipe());

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(3001, '0.0.0.0');
  console.log(`🚀 Backend is running on: http://localhost:3001`);
}
bootstrap();