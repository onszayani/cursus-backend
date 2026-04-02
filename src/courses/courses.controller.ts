/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Configuration Multer — stockage sur disque
const multerStorage = diskStorage({
  destination: './uploads/courses',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // GET /courses?subject=Algorithmique
  @Get()
  @ApiOperation({ summary: 'Mes supports de cours' })
  findAll(@CurrentUser() user: any, @Query('subject') subject?: string) {
    return this.coursesService.findForUser(user, subject);
  }

  // POST /courses/upload  (enseignant uniquement)
  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Uploader un support de cours' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        subject: { type: 'string' },
        targetGroup: { type: 'string' },
        semester: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
      fileFilter: (req, file, cb) => {
        // Accepter PDF, images, Word, PowerPoint
        const allowed = /pdf|jpeg|jpg|png|doc|docx|ppt|pptx/;
        cb(null, allowed.test(extname(file.originalname).toLowerCase()));
      },
    }),
  )
  upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMaterialDto,
  ) {
    return this.coursesService.create(dto, user.id, file);
  }

  // DELETE /courses/:id
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({
    summary: 'Supprimer un support (enseignant propriétaire ou admin)',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.remove(id, user.id, user.role);
  }
}
