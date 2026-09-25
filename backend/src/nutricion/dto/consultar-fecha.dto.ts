import { IsOptional, Matches } from 'class-validator'

export class ConsultarFechaDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe tener el formato AAAA-MM-DD' })
  fecha?: string
}
