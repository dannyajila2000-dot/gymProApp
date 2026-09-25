import { IsOptional, Matches, Validate } from 'class-validator'
import type { ValidationArguments, ValidatorConstraintInterface } from 'class-validator'
import { ValidatorConstraint } from 'class-validator'

@ValidatorConstraint({ name: 'esFechaCalendarioValida', async: false })
class EsFechaCalendarioValidaConstraint implements ValidatorConstraintInterface {
  validate(fecha: string) {
    const [anio, mes, dia] = fecha.split('-').map(Number)
    const fechaParseada = new Date(Date.UTC(anio, mes - 1, dia))
    return (
      fechaParseada.getUTCFullYear() === anio &&
      fechaParseada.getUTCMonth() === mes - 1 &&
      fechaParseada.getUTCDate() === dia
    )
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} no es una fecha calendario válida`
  }
}

export class ConsultarFechaDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe tener el formato AAAA-MM-DD' })
  @Validate(EsFechaCalendarioValidaConstraint)
  fecha?: string
}
