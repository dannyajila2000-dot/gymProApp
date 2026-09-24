import { Module } from '@nestjs/common'
import { ProgresoService } from './progreso.service.js'
import { ProgresoController } from './progreso.controller.js'

@Module({
  controllers: [ProgresoController],
  providers: [ProgresoService],
})
export class ProgresoModule {}
