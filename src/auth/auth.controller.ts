import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/login.dto';
import { AtGuard } from './guards/at.guards';
import { RtGuard } from './guards/rt.guards';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/signin.dto';

export interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    refreshToken: string;
  };
}

@ApiBearerAuth('access-token')
@ApiTags('Auth') 
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() 
  @Post('signup')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.SignUp(createAuthDto);
  }

  @Public()
  @Post('signin')
  findOne(@Body() loginDto: LoginDto) {
    return this.authService.SignIn(loginDto);
  }

  @UseGuards(AtGuard) // This endpoint requires authentication and you use the access token guard
  @Post('signout/:id')
  signOut(@Param('id') id: number) {
    return this.authService.signOut(id);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh/:id')
  refreshTokens(@Param('id') id: number, @Req() req: RequestWithUser) {
    const user = req.user;
    if (!user || !user.refreshToken) {
      throw new Error('No user or refresh token found in request');
    }
    return this.authService.refreshTokens(id, req.user.refreshToken);
  }
}
