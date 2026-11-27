import {
 Body,
 ConflictException,
 Controller,
 HttpCode,
 HttpStatus,
 Injectable,
 Post,
 UnauthorizedException,
 UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { JwtService } from '@nestjs/jwt';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';

export class CredentialsDto {
 @IsEmail()
 @Transform(({ value }) =>
     typeof value === 'string' ? value.toLowerCase().trim() : value,
 )
 email: string;

 @IsString()
 @MinLength(8)
 @MaxLength(72)
 password: string;
}

const BCRYPT_ROUNDS = 12;

const DUMMY_HASH =
    '$2b$12$C6UzMDM.H6dfI/f/IKcEeO6QZm4zS0V8vXzY9q1kU8o8Xq1kU8o8X';

export interface PublicUser {
 id: string;
 email: string;
}

export interface LoginResult {
 accessToken: string;
}

@Injectable()
export class AuthService {
 constructor(
     private readonly prisma: PrismaService,
     private readonly jwt: JwtService,
 ) {}

 async register(dto: CredentialsDto): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

  try {
   return await this.prisma.user.create({
    data: { email: dto.email, passwordHash },
    select: { id: true, email: true },
   });
  } catch (e) {
   if (
       e instanceof Prisma.PrismaClientKnownRequestError &&
       e.code === 'P2002'
   ) {
    throw new ConflictException('Email sudah terdaftar');
   }
   throw e;
  }
 }

 async login(dto: CredentialsDto): Promise<LoginResult> {
  const user = await this.prisma.user.findUnique({
   where: { email: dto.email },
   select: { id: true, email: true, passwordHash: true },
  });

  const hash = user?.passwordHash ?? DUMMY_HASH;
  const isValid = await bcrypt.compare(dto.password, hash);

  if (!user || !isValid) {
   throw new UnauthorizedException('Email atau password salah');
  }

  return {
   accessToken: await this.jwt.signAsync({
    sub: user.id,
    email: user.email,
   }),
  };
 }
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
 constructor(private readonly auth: AuthService) {}

 @Post('register')
 @HttpCode(HttpStatus.CREATED)
 @Throttle({ default: { limit: 5, ttl: 60_000 } })
 register(@Body() dto: CredentialsDto): Promise<PublicUser> {
  return this.auth.register(dto);
 }

 @Post('login')
 @HttpCode(HttpStatus.OK)
 @Throttle({ default: { limit: 5, ttl: 60_000 } })
 login(@Body() dto: CredentialsDto): Promise<LoginResult> {
  return this.auth.login(dto);
 }
}