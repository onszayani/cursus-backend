/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmploiDuTempsService } from './emploi-du-temps.service';
import { CreateEmploiDto } from './dto/create-emploi.dto';
import { UpdateEmploiDto } from './dto/update-emploi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('emploi-du-temps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emploi-du-temps')
export class EmploiDuTempsController {
  constructor(private readonly emploiService: EmploiDuTempsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @ApiOperation({ summary: "Créer un créneau dans l'emploi du temps" })
  create(@Body() createEmploiDto: CreateEmploiDto) {
    return this.emploiService.create(createEmploiDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les créneaux' })
  findAll(
    @Query('groupeId') groupeId?: string,
    @Query('enseignantId') enseignantId?: string,
    @Query('semaine') semaine?: string,
  ) {
    return this.emploiService.findAll({
      groupeId,
      enseignantId,
      semaine: semaine ? parseInt(semaine) : undefined,
    });
  }

  @Get('etudiant')
  @ApiOperation({
    summary: "Récupérer l'emploi du temps de l'étudiant connecté",
  })
  getEmploiForStudent(
    @CurrentUser() user: any,
    @Query('semaine') semaine?: string,
  ) {
    return this.emploiService.getEmploiForStudent(
      user.id,
      semaine ? parseInt(semaine) : undefined,
    );
  }

  @Get('enseignant')
  @ApiOperation({
    summary: "Récupérer l'emploi du temps de l'enseignant connecté",
  })
  getEmploiForTeacher(
    @CurrentUser() user: any,
    @Query('semaine') semaine?: string,
  ) {
    return this.emploiService.getEmploiForTeacher(
      user.id,
      semaine ? parseInt(semaine) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un créneau par ID' })
  findOne(@Param('id') id: string) {
    return this.emploiService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @ApiOperation({ summary: 'Mettre à jour un créneau' })
  update(@Param('id') id: string, @Body() updateEmploiDto: UpdateEmploiDto) {
    return this.emploiService.update(id, updateEmploiDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @ApiOperation({ summary: 'Supprimer un créneau' })
  remove(@Param('id') id: string) {
    return this.emploiService.remove(id);
  }
}
