import {
 Body,
 Controller,
 Delete,
 Get,
 HttpCode,
 HttpStatus,
 NotFoundException,
 Param,
 Patch,
 Post,
 Req,
 UseGuards,
} from '@nestjs/common';
import {
 IsBoolean,
 IsOptional,
 IsString,
 MaxLength,
 MinLength,
} from 'class-validator';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard } from './jwt.guard';

export interface AuthUser {
 sub: string;
 email: string;
}

interface AuthenticatedRequest {
 user: AuthUser;
}

class CreateTaskDto {
 @IsString()
 @MinLength(1)
 @MaxLength(120)
 title: string;

 @IsOptional()
 @IsString()
 @MaxLength(1000)
 description?: string;
}

class UpdateTaskDto {
 @IsOptional()
 @IsString()
 @MinLength(1)
 @MaxLength(120)
 title?: string;

 @IsOptional()
 @IsString()
 @MaxLength(1000)
 description?: string;

 @IsOptional()
 @IsBoolean()
 completed?: boolean;
}

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
 constructor(private readonly prisma: PrismaService) {}

 @Get()
 all(@Req() req: AuthenticatedRequest) {
  return this.prisma.task.findMany({
   where: { ownerId: req.user.sub },
   orderBy: { createdAt: 'desc' },
  });
 }

 @Post()
 @HttpCode(HttpStatus.CREATED)
 create(
     @Req() req: AuthenticatedRequest,
     @Body() dto: CreateTaskDto,
 ) {
  return this.prisma.task.create({
   data: { ...dto, ownerId: req.user.sub },
  });
 }

 @Patch(':id')
 async update(
     @Req() req: AuthenticatedRequest,
     @Param('id') id: string,
     @Body() dto: UpdateTaskDto,
 ) {
  const result = await this.prisma.task.updateMany({
   where: { id, ownerId: req.user.sub },
   data: dto,
  });

  if (!result.count) {
   throw new NotFoundException('Tugas tidak ditemukan');
  }

  return this.prisma.task.findFirst({
   where: { id, ownerId: req.user.sub },
  });
 }

 @Delete(':id')
 @HttpCode(HttpStatus.OK)
 async remove(
     @Req() req: AuthenticatedRequest,
     @Param('id') id: string,
 ) {
  const result = await this.prisma.task.deleteMany({
   where: { id, ownerId: req.user.sub },
  });

  if (!result.count) {
   throw new NotFoundException('Tugas tidak ditemukan');
  }

  return { message: 'Tugas dihapus' };
 }
}