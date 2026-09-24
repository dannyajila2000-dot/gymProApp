import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RutinasModule } from './rutinas/rutinas.module.js';
import { ProgresoModule } from './progreso/progreso.module.js';
import { NutricionModule } from './nutricion/nutricion.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RutinasModule,
    ProgresoModule,
    NutricionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
