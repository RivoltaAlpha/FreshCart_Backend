import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

export class RtGuard extends AuthGuard('refresh') {
  constructor(private configService: ConfigService) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const request = super.getRequest(context);
    return request;
  }
}
