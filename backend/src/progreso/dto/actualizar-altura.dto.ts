import { IsNumber, IsPositive } from 'class-validator'

export class ActualizarAlturaDto {
  @IsNumber()
  @IsPositive()
  alturaCm!: number
}
