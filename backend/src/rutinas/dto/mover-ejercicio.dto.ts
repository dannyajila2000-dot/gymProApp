import { IsIn } from 'class-validator'

export class MoverEjercicioDto {
  @IsIn(['arriba', 'abajo'])
  direccion!: 'arriba' | 'abajo'
}
