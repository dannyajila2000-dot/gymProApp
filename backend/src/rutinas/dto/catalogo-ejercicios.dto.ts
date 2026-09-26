import { IsOptional, IsString } from 'class-validator'

export class CatalogoEjerciciosDto {
  @IsOptional()
  @IsString()
  grupoMuscular?: string

  @IsOptional()
  @IsString()
  busqueda?: string
}
