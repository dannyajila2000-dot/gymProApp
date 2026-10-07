import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'

/** Activar la cuenta de un socio que el gimnasio dio de alta en AdminPro y ya invitó a la app. */
export class ActivarDto {
  @IsString()
  @Matches(/^[A-Za-z0-9-]{3,20}$/, { message: 'El código de gimnasio no es válido' })
  codigoGimnasio!: string

  @IsEmail()
  email!: string

  /** Código de 6 dígitos que llegó al correo del socio. */
  @IsString()
  @Matches(/^\d{6}$/, { message: 'El código de activación son 6 dígitos' })
  codigo!: string

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string
}
