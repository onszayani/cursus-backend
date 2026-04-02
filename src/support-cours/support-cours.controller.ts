/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SupportCoursService } from './support-cours.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-suppot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('support-cours')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support-cours')
export class SupportCoursController {
  constructor(private readonly supportService: SupportCoursService) {}

  @Post()
  @Roles(Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: './uploads/supports',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titre: { type: 'string' },
        description: { type: 'string' },
        coursId: { type: 'string' },
        fichier: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async create(
    @Body() createSupportDto: CreateSupportDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({
            fileType: '.(pdf|doc|docx|ppt|pptx|mp4|zip)',
          }),
        ],
      }),
    )
    fichier: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const fichierUrl = `/uploads/supports/${fichier.filename}`;
    const typeFichier = fichier.mimetype.split('/')[0];

    return this.supportService.create(
      createSupportDto,
      user.id,
      fichierUrl,
      typeFichier,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les supports' })
  findAll(@Query('coursId') coursId?: string) {
    return this.supportService.findAll({ coursId });
  }

  @Get('etudiant')
  @ApiOperation({ summary: "Récupérer les supports pour l'étudiant connecté" })
  getSupportsForStudent(@CurrentUser() user: any) {
    return this.supportService.getSupportsForStudent(user.id);
  }

  @Get('enseignant')
  @ApiOperation({
    summary: "Récupérer les supports pour l'enseignant connecté",
  })
  getSupportsForTeacher(@CurrentUser() user: any) {
    return this.supportService.getSupportsForTeacher(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un support par ID' })
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un support' })
  update(
    @Param('id') id: string,
    @Body() updateSupportDto: UpdateSupportDto,
    @CurrentUser() user: any,
  ) {
    return this.supportService.update(id, updateSupportDto, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un support' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.supportService.remove(id, user.id, user.role);
  }
}
