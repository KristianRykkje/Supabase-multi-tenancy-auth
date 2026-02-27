import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTOs with validation
 */
class SignUpDto {
  @IsString()
  @MaxLength(100)
  tenant_slug: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}

class LoginDto {
  @IsString()
  @MaxLength(100)
  tenant_slug: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class OtpDto {
  @IsString()
  @MaxLength(100)
  tenant_slug: string;

  @IsEmail()
  email: string;
}

class VerifyOtpDto {
  @IsString()
  @MaxLength(100)
  tenant_slug: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  token: string;
}

/**
 * AUTH CONTROLLER
 * Rate limiting configured per endpoint for security
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * ROOT / HEALTH CHECK
   */
  @Get()
  getStatus() {
    return {
      status: 'ok',
      message: 'Supabase Multi-Tenant Auth API',
      version: '1.0.0',
    };
  }

  /**
   * SIGN UP
   * Rate limit: 5 requests per minute (prevents spam accounts)
   */
  @Post('signup')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.tenant_slug, dto.email, dto.password);
  }

  /**
   * LOGIN
   * Rate limit: 10 requests per minute (prevents brute force)
   */
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.tenant_slug, dto.email, dto.password);
  }

  /**
   * REQUEST OTP (ONE-TIME PASSWORD)
   * Rate limit: 5 requests per minute
   */
  @Post('otp/request')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestOtp(@Body() dto: OtpDto) {
    return this.authService.requestOtp(dto.tenant_slug, dto.email);
  }

  /**
   * VERIFY OTP (ONE-TIME PASSWORD)
   * Rate limit: 10 requests per minute
   */
  @Post('otp/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.tenant_slug, dto.email, dto.token);
  }
}
