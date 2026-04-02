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
import { GroupeService } from './groupe.service';
import { CreateGroupeDto } from './dto/create-groupe.dto';
import { UpdateGroupeDto } from './dto/update-groupe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('groupes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groupes')
export class GroupeController {
  constructor(private readonly groupeService: GroupeService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @ApiOperation({ summary: 'Créer un groupe' })
  create(@Body() createGroupeDto: CreateGroupeDto) {
    return this.groupeService.create(createGroupeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes' })
  findAll(
    @Query('specialite') specialite?: string,
    @Query('niveau') niveau?: string,
    @Query('anneeScolaire') anneeScolaire?: string,
  ) {
    return this.groupeService.findAll({ specialite, niveau, anneeScolaire });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe par ID' })
  findOne(@Param('id') id: string) {
    return this.groupeService.findOne(id);
  }

  @Get(':id/etudiants')
  @ApiOperation({ summary: "Récupérer les étudiants d'un groupe" })
  getEtudiants(@Param('id') id: string) {
    return this.groupeService.getEtudiants(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @ApiOperation({ summary: 'Mettre à jour un groupe' })
  update(@Param('id') id: string, @Body() updateGroupeDto: UpdateGroupeDto) {
    return this.groupeService.update(id, updateGroupeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer un groupe' })
  remove(@Param('id') id: string) {
    return this.groupeService.remove(id);
  }
}
