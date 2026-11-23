import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CSRF_COOKIE_NAME } from '../../common/guards/csrf.guard';
import * as crypto from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * GET /api/v1/auth/csrf
   * Issues or refreshes the double-submit CSRF cookie
   */
  @Public()
  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  async getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const existing = req.cookies?.[CSRF_COOKIE_NAME];
    const token = existing || crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { csrfToken: token };
  }

  /**
   * POST /api/v1/auth/register
   * Registers a new user account, creates session, sets cookies
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, req);
    this.tokenService.setAuthCookies(res, result.tokens);
    return result;
  }

  /**
   * POST /api/v1/auth/login
   * Authenticates user, creates rotating session, sets HttpOnly cookies
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req);
    this.tokenService.setAuthCookies(res, result.tokens);
    return result;
  }

  /**
   * POST /api/v1/auth/logout
   * Revokes the active session and clears auth cookies
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (user.sessionId) {
      await this.authService.logout(user.sessionId, user.id, req);
    }
    this.tokenService.clearAuthCookies(res);
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * POST /api/v1/auth/logout-all
   * Revokes all active sessions for the user across all devices
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAll(user.id, req);
    this.tokenService.clearAuthCookies(res);
    return result;
  }

  /**
   * POST /api/v1/auth/refresh
   * Rotates refresh token, detects reuse, and returns fresh credentials
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = this.tokenService.extractRefreshToken(req, dto.refreshToken);
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required via cookie or request body');
    }

    const result = await this.authService.refresh(rawRefreshToken, req);
    this.tokenService.setAuthCookies(res, result.tokens);
    return result;
  }

  /**
   * GET /api/v1/auth/me
   * Retrieves profile of current authenticated user
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  /**
   * POST /api/v1/auth/change-password
   * Changes authenticated user password and invalidates existing sessions
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(user.id, dto, req);
    this.tokenService.clearAuthCookies(res);
    return result;
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Requests a password reset link (rate-limited, enumeration protected)
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, req);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Resets account password using a valid reset token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(dto, req);
    this.tokenService.clearAuthCookies(res);
    return result;
  }

  /**
   * POST /api/v1/auth/verify-email
   * Confirms email address verification token
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmail(dto, req);
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Dispatches a fresh email verification token
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto, @Req() req: Request) {
    return this.authService.resendVerification(dto, req);
  }
}
