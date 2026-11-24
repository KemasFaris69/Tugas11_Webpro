import { Body, Controller, Post, Injectable, ConflictException, UnauthorizedException, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';
export class CredentialsDto {
 @IsEmail() email: string;
 @IsString() @MinLength(8) @MaxLength(72) password: string;
}
@Injectable()
export class AuthService {
 constructor(private prisma: PrismaService,private jwt: JwtService) {}
 async register(dto:CredentialsDto){
  const email=dto.email.toLowerCase().trim();
  if(await this.prisma.user.findUnique({where:{email}})) throw new ConflictException('Email sudah terdaftar');
  const passwordHash=await bcrypt.hash(dto.password,10);
  try {const user=await this.prisma.user.create({data:{email,passwordHash}});return {id:user.id,email:user.email};}
  catch(e:any){if(e.code==='P2002')throw new ConflictException('Email sudah terdaftar');throw e;}
 }
 async login(dto:CredentialsDto){
  const user=await this.prisma.user.findUnique({where:{email:dto.email.toLowerCase().trim()}});
  if(!user || !(await bcrypt.compare(dto.password,user.passwordHash)))throw new UnauthorizedException('Email atau password salah');
  return {accessToken:await this.jwt.signAsync({sub:user.id,email:user.email})};
 }
}
@Controller('auth')
export class AuthController {
 constructor(private auth:AuthService){}
 @Post('register') @Throttle({default:{limit:5,ttl:60000}}) register(@Body() dto:CredentialsDto){return this.auth.register(dto)}
 @Post('login') @Throttle({default:{limit:5,ttl:60000}}) login(@Body() dto:CredentialsDto){return this.auth.login(dto)}
}
