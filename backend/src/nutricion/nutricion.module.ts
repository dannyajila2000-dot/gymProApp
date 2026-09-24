import { Module } from '@nestjs/common'
import { NutricionService } from './nutricion.service.js'
import { NutricionController } from './nutricion.controller.js'

@Module({
  controllers: [NutricionController],
  providers: [NutricionService],
})
export class NutricionModule {}
