import { Injectable, Logger } from '@nestjs/common'

export type EstadoMembresia = 'activo' | 'por_vencer' | 'vencido' | 'sin_membresia'

export type MembresiaAdmin = {
  estado: EstadoMembresia
  plan: string | null
  fechaVencimiento: string | null
  diasRestantes: number | null
}

export type FichaSocioAdmin = {
  clienteId: string
  nombres: string
  apellidos: string
  email: string | null
  telefono: string | null
  activo: boolean
  sucursal: { id: string; nombre: string } | null
  membresia: MembresiaAdmin
}

export type SucursalAdmin = { id: string; nombre: string; direccion: string | null }

/** AdminPro no responde (sin red, tardó demasiado o falló por dentro). La app sigue con lo último que sabía. */
export class AdminProNoDisponible extends Error {}

/** AdminPro respondió que no (código inválido, socio inexistente, clave rechazada...). */
export class AdminProRechazo extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

// Render duerme los servicios gratuitos y despertarlos tarda hasta ~30 s: la activación (se hace una sola vez y con
// el socio esperando) tolera más que el refresco al iniciar sesión, que debe ser rápido y puede usar lo guardado.
export const TIMEOUT_ACTIVACION_MS = 45_000
export const TIMEOUT_REFRESCO_MS = 8_000

/**
 * Cliente de la API de integración de AdminPro (servidor a servidor, con la clave en `x-api-key`).
 * AdminPro es la fuente de verdad de socios, sucursales y membresías; esta app solo consulta.
 */
@Injectable()
export class AdminProClient {
  private readonly logger = new Logger(AdminProClient.name)

  /** Hay URL y clave configuradas (ADMINPRO_URL y ADMINPRO_API_KEY). */
  disponible() {
    return !!process.env.ADMINPRO_URL && !!process.env.ADMINPRO_API_KEY
  }

  private async pedir<T>(metodo: 'GET' | 'POST', ruta: string, timeoutMs: number, cuerpo?: unknown): Promise<T> {
    let respuesta: Response
    try {
      respuesta = await fetch(`${process.env.ADMINPRO_URL!.replace(/\/$/, '')}${ruta}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ADMINPRO_API_KEY! },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (e) {
      this.logger.warn(`AdminPro no respondió (${metodo} ${ruta}): ${(e as Error).message}`)
      throw new AdminProNoDisponible('No pudimos comunicarnos con el gimnasio')
    }

    const texto = await respuesta.text()
    let datos: { message?: string | string[] } | null = null
    try {
      datos = texto ? JSON.parse(texto) : null
    } catch {
      datos = null
    }

    if (!respuesta.ok) {
      const mensaje = Array.isArray(datos?.message) ? datos.message[0] : (datos?.message ?? 'Error')
      if (respuesta.status >= 500) {
        this.logger.warn(`AdminPro respondió ${respuesta.status} (${metodo} ${ruta}): ${mensaje}`)
        throw new AdminProNoDisponible('No pudimos comunicarnos con el gimnasio')
      }
      if (respuesta.status === 401) {
        this.logger.error('AdminPro rechazó la clave de integración (ADMINPRO_API_KEY): revisa que sea la vigente')
      }
      throw new AdminProRechazo(respuesta.status, mensaje)
    }
    return datos as T
  }

  sucursales(timeoutMs = TIMEOUT_REFRESCO_MS) {
    return this.pedir<SucursalAdmin[]>('GET', '/integracion/sucursales', timeoutMs)
  }

  validarActivacion(email: string, codigo: string) {
    return this.pedir<FichaSocioAdmin>('POST', '/integracion/activar', TIMEOUT_ACTIVACION_MS, { email, codigo })
  }

  confirmarActivacion(clienteId: string) {
    return this.pedir<{ ok: boolean }>('POST', '/integracion/activar/confirmar', TIMEOUT_ACTIVACION_MS, { clienteId })
  }

  estadoSocio(clienteId: string, timeoutMs = TIMEOUT_REFRESCO_MS) {
    return this.pedir<FichaSocioAdmin>('GET', `/integracion/socios/${encodeURIComponent(clienteId)}/estado`, timeoutMs)
  }
}
