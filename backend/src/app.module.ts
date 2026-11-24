import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { AuthController, AuthService } from './auth';
import { TasksController } from './tasks';
@Module({imports:[ConfigModule.forRoot({isGlobal:true}), JwtModule.register({global:true, secret: process.env.JWT_SECRET, signOptions:{expiresIn:'15m'}}), ThrottlerModule.forRoot([{ttl:60000,limit:30}])],controllers:[AuthController,TasksController],providers:[PrismaService,AuthService,{provide:APP_GUARD,useClass:ThrottlerGuard}]})
export class AppModule {}
