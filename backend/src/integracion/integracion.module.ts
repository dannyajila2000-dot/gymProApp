import { Global, Module } from '@nestjs/common'
import { AdminProClient } from './adminpro.client.js'
import { MembresiaGuard } from './membresia.guard.js'
import { MembresiaService } from './membresia.service.js'

/** Conexión con AdminPro. Global para que cualquier módulo pueda usar el guard de membresía sin importarlo. */
@Global()
@Module({
  providers: [AdminProClient, MembresiaService, MembresiaGuard],
  exports: [AdminProClient, MembresiaService, MembresiaGuard],
})
export class IntegracionModule {}
