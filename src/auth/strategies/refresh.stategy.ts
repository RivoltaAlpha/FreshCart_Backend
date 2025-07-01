import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JWTPayload = {
  sub: number;
  email: string;
};

interface PayloadWithRt extends JWTPayload {
  refreshToken: string;
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true, // Pass the request to the validate function
    });
  }

  validate(req: Request, payload: JWTPayload): PayloadWithRt {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const rt = authHeader.replace('Bearer', '').trim();
    if (!rt) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    return { sub: payload.sub, email: payload.email, refreshToken: rt };
  }
}
