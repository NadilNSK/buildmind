import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { AuditService } from './services/audit.service';

const jwtSecret =
  process.env.JWT_SECRET ||
  'super_secret_buildmind_jwt_signing_key_replace_in_prod_min_32_chars';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, AuditService],
  exports: [AuthService, PasswordService, TokenService, AuditService, JwtModule],
})
export class AuthModule {}
