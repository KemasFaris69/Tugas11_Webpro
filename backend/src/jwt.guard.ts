
import {
 CanActivate,
 ExecutionContext,
 Injectable,
 UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
 sub: string;
 email: string;
}

interface AuthenticatedRequest extends Request {
 user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
 constructor(private readonly jwt: JwtService) {}

 async canActivate(context: ExecutionContext): Promise<boolean> {
  const req = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
   throw new UnauthorizedException('Token tidak ditemukan');
  }

  const token = authHeader.slice(7);

  if (!token) {
   throw new UnauthorizedException('Token tidak ditemukan');
  }

  try {
   const payload = await this.jwt.verifyAsync<JwtPayload>(token);

   if (
       typeof payload.sub !== 'string' ||
       typeof payload.email !== 'string'
   ) {
    throw new UnauthorizedException('Payload token tidak valid');
   }

   req.user = {
    sub: payload.sub,
    email: payload.email,
   };

   return true;
  } catch {
   throw new UnauthorizedException(
       'Token tidak valid atau sudah kedaluwarsa',
   );
  }
 }
}
