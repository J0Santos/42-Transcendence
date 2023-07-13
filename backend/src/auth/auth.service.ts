import { Injectable, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/db_interactions_modules/users/user.entity';
import { UsersService } from 'src/db_interactions_modules/users/users.service';
import { TwoFactorAuthService } from './2FA/2FA-service';
import { authenticator } from 'otplib';
import { resourceUsage } from 'process';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private twoFactorAuthService: TwoFactorAuthService,
    ) {}
   
  async login(user: User) {
    const infoToSend  = {
      intra_nick : user.intra_nick,
      nick : user.nick,
      id : user.id,
    }
    const payload = {
      user: infoToSend,
      id: user.id,
    };
    return {
      TwoFAEnabled: user.TwoFAEnabled,
      TwoFASecret: user.TwoFASecret,
      user: payload.user,
      id: payload.id,
      access_token: this.jwtService.sign(payload, {privateKey: `${process.env.JWT_SECRET_KEY}`,/*expiresIn: '30s'*/expiresIn: '1d'}),
    };
  }


  googleLogin(@Req() req:any) {
    const infoToSend  = {
      intra_nick : req.user.intra_nick,
      nick : req.user.nick,
      id : req.user.id
      
    }
    const payload = {
      user: infoToSend,
      id: req.user.id, 
      TwoFAEnabled: req.user.TwoFAEnabled
    };
    return {
      TwoFAEnabled: req.user.TwoFAEnabled,
      TwoFASecret: req.user.TwoFASecret,
      user: payload.user,
      id: payload.id,
      access_token: this.jwtService.sign(payload, {privateKey: `${process.env.JWT_SECRET_KEY}`,/*expiresIn: '30s'*/expiresIn: '1d'}),
    }
  }
}