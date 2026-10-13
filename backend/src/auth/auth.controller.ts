import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-signup-otp')
  async requestSignupOTP(@Body() body: { fullName: string; studentId: string; faculty: string; email: string; faceImage?: string }) {
    return this.authService.requestSignupOTP(body);
  }

  @Post('verify-signup')
  async verifySignup(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyAndSignup(body.email, body.otp);
  }

  @Post('request-login-otp')
  async requestLoginOTP(@Body() body: { email: string }) {
    return this.authService.requestLoginOTP(body.email);
  }

  @Post('verify-login')
  async verifyLoginOTP(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyLoginOTP(body.email, body.otp);
  }
}