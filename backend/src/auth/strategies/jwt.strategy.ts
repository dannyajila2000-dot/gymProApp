import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

interface PayloadAcceso {
  sub: string
  gimnasioId: string
  email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    })
  }

  validate(payload: PayloadAcceso) {
    return { clienteId: payload.sub, gimnasioId: payload.gimnasioId, email: payload.email }
  }
}
