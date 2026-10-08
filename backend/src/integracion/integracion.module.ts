import { Global, Module } from '@nestjs/common'
import { AdminProClient } from './adminpro.client.js'
import { AvisoController } from './aviso.controller.js'
import { MedicionesAdminService } from './mediciones-admin.service.js'
import { MembresiaGuard } from './membresia.guard.js'
import { MembresiaService } from './membresia.service.js'

/** Conexión con AdminPro. Global para que cualquier módulo pueda usar el guard de membresía sin importarlo. */
@Global()
@Module({
  controllers: [AvisoController],
  providers: [AdminProClient, MembresiaService, MembresiaGuard, MedicionesAdminService],
  exports: [AdminProClient, MembresiaService, MembresiaGuard, MedicionesAdminService],
})
export class IntegracionModule {}
