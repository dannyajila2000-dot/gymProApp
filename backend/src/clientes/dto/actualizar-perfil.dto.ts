import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator'

const REGEX_NOMBRE_PERSONA = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(REGEX_NOMBRE_PERSONA, { message: 'nombres solo puede tener letras' })
  nombres?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(REGEX_NOMBRE_PERSONA, { message: 'apellidos solo puede tener letras' })
  apellidos?: string

  @IsOptional()
  @Matches(/^[0-9]{7,10}$/, { message: 'telefono debe tener entre 7 y 10 dígitos' })
  telefono?: string

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string

  @IsOptional()
  @IsIn(['kg', 'lb'])
  unidadPeso?: string

  @IsOptional()
  @IsIn(['cm', 'in'])
  unidadAltura?: string

  @IsOptional()
  @IsIn(['ninguna', 'impacto_bajo', 'sin_saltos'])
  restriccionFisica?: string

  @IsOptional()
  @IsIn(['animacion', 'video'])
  preferenciaEntrenador?: string

  @IsOptional()
  @IsBoolean()
  guiaDeVozActiva?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(15)
  cuentaAtrasSeg?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  volumenMusica?: number

  @IsOptional()
  @IsBoolean()
  bajarVolumenConVoz?: boolean
}
