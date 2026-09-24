import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class RegistroDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombres!: string

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  apellidos!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string

  @IsString()
  @Matches(/^[A-Za-z0-9-]{3,20}$/, {
    message: 'El código de gimnasio no es válido',
  })
  codigoGimnasio!: string
}
