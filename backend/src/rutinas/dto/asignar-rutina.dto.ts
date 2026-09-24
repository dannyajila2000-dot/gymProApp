import { IsUUID } from 'class-validator'

export class AsignarRutinaDto {
  @IsUUID()
  rutinaId!: string
}
