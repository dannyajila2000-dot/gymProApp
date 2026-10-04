import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

/**
 * Límite de intentos para las rutas sensibles (inicio de sesión, registro, cambio de contraseña),
 * para que nadie pueda probar contraseñas sin parar ni llenar la base de cuentas basura.
 *
 * Cuenta intentos en una ventana de tiempo, en memoria (suficiente mientras el backend corre en
 * una sola instancia; si algún día hay varias, habría que moverlo a Redis o a la base de datos).
 *
 *  - por 'email': por cuenta, sin importar desde dónde. Es la defensa que no depende de la IP.
 *  - por 'ip': por dirección de origen, como red de seguridad contra barridos masivos. Detrás del
 *    proxy de Render la IP llega por X-Forwarded-For (ver `trust proxy` en main.ts), así que los
 *    topes por IP son generosos a propósito.
 */
export interface ReglaLimite {
  por: 'ip' | 'email'
  max: number
  ventanaSeg: number
}

const METADATA_LIMITES = 'limite_intentos_reglas'

export const LimiteIntentos = (...reglas: ReglaLimite[]) => SetMetadata(METADATA_LIMITES, reglas)

@Injectable()
export class LimiteIntentosGuard implements CanActivate {
  private readonly intentos = new Map<string, number[]>()
  private ultimaLimpieza = Date.now()

  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const reglas = this.reflector.get<ReglaLimite[] | undefined>(METADATA_LIMITES, contexto.getHandler())
    if (!reglas?.length) return true

    const peticion = contexto.switchToHttp().getRequest()
    const respuesta = contexto.switchToHttp().getResponse()
    const ahora = Date.now()
    this.limpiarSiHaceFalta(ahora)

    const ruta = `${contexto.getClass().name}.${contexto.getHandler().name}`
    for (const regla of reglas) {
      const sujeto =
        regla.por === 'email' ? String(peticion.body?.email ?? '').trim().toLowerCase() : String(peticion.ip ?? '')
      if (!sujeto) continue

      const clave = `${ruta}|${regla.por}|${sujeto}`
      const marcas = (this.intentos.get(clave) ?? []).filter((t) => ahora - t < regla.ventanaSeg * 1000)

      if (marcas.length >= regla.max) {
        const espera = Math.max(1, Math.ceil((marcas[0] + regla.ventanaSeg * 1000 - ahora) / 1000))
        respuesta.setHeader('Retry-After', String(espera))
        const minutos = Math.ceil(espera / 60)
        throw new HttpException(
          `Demasiados intentos. Inténtalo de nuevo en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      marcas.push(ahora)
      this.intentos.set(clave, marcas)
    }
    return true
  }

  /** Borra de vez en cuando los registros viejos para que el mapa no crezca sin límite. */
  private limpiarSiHaceFalta(ahora: number) {
    if (ahora - this.ultimaLimpieza < 60_000) return
    this.ultimaLimpieza = ahora
    for (const [clave, marcas] of this.intentos) {
      if (!marcas.length || ahora - marcas[marcas.length - 1] > 7_200_000) this.intentos.delete(clave)
    }
  }
}
