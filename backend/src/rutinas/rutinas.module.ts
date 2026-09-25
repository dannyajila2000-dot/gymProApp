import { Module } from '@nestjs/common'
import { RutinasService } from './rutinas.service.js'
import { RutinasController } from './rutinas.controller.js'

@Module({
  controllers: [RutinasController],
  providers: [RutinasService],
  exports: [RutinasService],
})
export class RutinasModule {}
