import { Module } from '@nestjs/common'
import { ClientesService } from './clientes.service.js'
import { ClientesController } from './clientes.controller.js'
import { RutinasModule } from '../rutinas/rutinas.module.js'

@Module({
  imports: [RutinasModule],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
