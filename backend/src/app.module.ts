import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RutinasModule } from './rutinas/rutinas.module.js';
import { ProgresoModule } from './progreso/progreso.module.js';
import { NutricionModule } from './nutricion/nutricion.module.js';
import { ClientesModule } from './clientes/clientes.module.js';
import { RecordatoriosModule } from './recordatorios/recordatorios.module.js';
import { FeedbackModule } from './feedback/feedback.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RutinasModule,
    ProgresoModule,
    NutricionModule,
    ClientesModule,
    RecordatoriosModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
