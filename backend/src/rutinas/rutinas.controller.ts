import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { RutinasService } from './rutinas.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { AsignarRutinaDto } from './dto/asignar-rutina.dto.js'
import { RegistrarSesionDto } from './dto/registrar-sesion.dto.js'
import { SustituirEjercicioDto } from './dto/sustituir-ejercicio.dto.js'
import { CatalogoEjerciciosDto } from './dto/catalogo-ejercicios.dto.js'
import { CrearRutinaPersonalDto } from './dto/crear-rutina-personal.dto.js'
import { ActualizarRutinaPersonalDto } from './dto/actualizar-rutina-personal.dto.js'
import { AgregarEjercicioRutinaDto } from './dto/agregar-ejercicio-rutina.dto.js'
import { ActualizarEjercicioRutinaDto } from './dto/actualizar-ejercicio-rutina.dto.js'
import { ReordenarEjerciciosDto } from './dto/reordenar-ejercicios.dto.js'
import { FijarRutinaDiaDto } from './dto/fijar-rutina-dia.dto.js'

@UseGuards(JwtAuthGuard)
@Controller('rutinas')
export class RutinasController {
  constructor(private readonly rutinasService: RutinasService) {}

  @Get()
  listarDisponibles(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.listarDisponibles(cliente.gimnasioId)
  }

  @Get('mi-rutina')
  miRutina(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.miRutina(cliente.clienteId)
  }

  @Get('entrenar/:rutinaId')
  rutinaParaEntrenar(@ClienteActual() cliente: ClienteAutenticado, @Param('rutinaId') rutinaId: string) {
    return this.rutinasService.rutinaParaEntrenar(cliente.clienteId, cliente.gimnasioId, rutinaId)
  }

  @Post('asignarme')
  asignarme(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: AsignarRutinaDto) {
    return this.rutinasService.asignarme(cliente.clienteId, cliente.gimnasioId, dto.rutinaId)
  }

  @Post('sesiones')
  registrarSesion(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: RegistrarSesionDto) {
    return this.rutinasService.registrarSesion(cliente.clienteId, cliente.gimnasioId, dto)
  }

  @Get('historial')
  historial(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.historial(cliente.clienteId)
  }

  @Get('plan-semana')
  planSemana(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.planSemana(cliente.clienteId, cliente.gimnasioId)
  }

  @Get('dias-fijados')
  diasFijados(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.listarRutinasFijadas(cliente.clienteId)
  }

  @Put('dias-fijados/:diaSemana')
  fijarRutinaEnDia(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('diaSemana') diaSemana: string,
    @Body() dto: FijarRutinaDiaDto,
  ) {
    return this.rutinasService.fijarRutinaEnDia(cliente.clienteId, cliente.gimnasioId, Number(diaSemana), dto.rutinaId)
  }

  @Delete('dias-fijados/:diaSemana')
  quitarRutinaDeDia(@ClienteActual() cliente: ClienteAutenticado, @Param('diaSemana') diaSemana: string) {
    return this.rutinasService.quitarRutinaDeDia(cliente.clienteId, Number(diaSemana))
  }

  @Get('ejercicios/:rutinaEjercicioId/alternativas')
  alternativas(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
  ) {
    return this.rutinasService.alternativasParaEjercicio(cliente.clienteId, cliente.gimnasioId, rutinaEjercicioId)
  }

  @Post('ejercicios/:rutinaEjercicioId/sustituir')
  sustituir(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
    @Body() dto: SustituirEjercicioDto,
  ) {
    return this.rutinasService.sustituirEjercicio(
      cliente.clienteId,
      cliente.gimnasioId,
      rutinaEjercicioId,
      dto.ejercicioId,
    )
  }

  @Delete('ejercicios/:rutinaEjercicioId/sustituir')
  quitarSustitucion(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
  ) {
    return this.rutinasService.quitarSustitucion(cliente.clienteId, cliente.gimnasioId, rutinaEjercicioId)
  }

  @Get('catalogo-ejercicios')
  catalogoEjercicios(@Query() { grupoMuscular, busqueda }: CatalogoEjerciciosDto) {
    return this.rutinasService.catalogoEjercicios(grupoMuscular, busqueda)
  }

  @Get('mias')
  misRutinasPersonales(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.misRutinasPersonales(cliente.clienteId)
  }

  @Post('duplicar/:rutinaId')
  duplicarComoPersonal(@ClienteActual() cliente: ClienteAutenticado, @Param('rutinaId') rutinaId: string) {
    return this.rutinasService.duplicarComoPersonal(cliente.clienteId, cliente.gimnasioId, rutinaId)
  }

  @Post('mias')
  crearRutinaPersonal(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: CrearRutinaPersonalDto) {
    return this.rutinasService.crearRutinaPersonal(cliente.clienteId, cliente.gimnasioId, dto)
  }

  @Patch('mias/:rutinaId')
  actualizarRutinaPersonal(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaId') rutinaId: string,
    @Body() dto: ActualizarRutinaPersonalDto,
  ) {
    return this.rutinasService.actualizarRutinaPersonal(cliente.clienteId, rutinaId, dto)
  }

  @Delete('mias/:rutinaId')
  eliminarRutinaPersonal(@ClienteActual() cliente: ClienteAutenticado, @Param('rutinaId') rutinaId: string) {
    return this.rutinasService.eliminarRutinaPersonal(cliente.clienteId, rutinaId)
  }

  @Post('mias/:rutinaId/ejercicios')
  agregarEjercicio(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaId') rutinaId: string,
    @Body() dto: AgregarEjercicioRutinaDto,
  ) {
    return this.rutinasService.agregarEjercicioARutinaPersonal(cliente.clienteId, rutinaId, dto)
  }

  @Patch('mias/:rutinaId/ejercicios/:rutinaEjercicioId')
  actualizarEjercicio(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaId') rutinaId: string,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
    @Body() dto: ActualizarEjercicioRutinaDto,
  ) {
    return this.rutinasService.actualizarEjercicioDeRutinaPersonal(cliente.clienteId, rutinaId, rutinaEjercicioId, dto)
  }

  @Delete('mias/:rutinaId/ejercicios/:rutinaEjercicioId')
  eliminarEjercicio(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaId') rutinaId: string,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
  ) {
    return this.rutinasService.eliminarEjercicioDeRutinaPersonal(cliente.clienteId, rutinaId, rutinaEjercicioId)
  }

  @Post('mias/:rutinaId/ejercicios/orden')
  reordenarEjercicios(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaId') rutinaId: string,
    @Body() dto: ReordenarEjerciciosDto,
  ) {
    return this.rutinasService.reordenarEjerciciosPersonal(cliente.clienteId, rutinaId, dto.ordenIds)
  }
}
