import { IsUUID } from 'class-validator'

export class FijarRutinaDiaDto {
  @IsUUID('4')
  rutinaId!: string
}
