import { ArrayMinSize, IsString, IsUUID } from 'class-validator'

export class ReordenarEjerciciosDto {
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  ordenIds!: string[]
}
