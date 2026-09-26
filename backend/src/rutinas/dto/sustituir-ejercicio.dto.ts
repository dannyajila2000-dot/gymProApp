import { IsUUID } from 'class-validator'

export class SustituirEjercicioDto {
  @IsUUID()
  ejercicioId!: string
}
