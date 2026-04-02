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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActualiteService } from './actualite.service';
import { CreateActualiteDto } from './dto/create-actualite.dto';
import { UpdateActualiteDto } from './dto/update-actualite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('actualites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('actualites')
export class ActualiteController {
  constructor(private readonly actualiteService: ActualiteService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT, Role.ENSEIGNANT)
  @ApiOperation({ summary: 'Créer une actualité' })
  create(
    @Body() createActualiteDto: CreateActualiteDto,
    @CurrentUser() user: any,
  ) {
    return this.actualiteService.create(createActualiteDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les actualités' })
  findAll() {
    return this.actualiteService.findAll({});
  }

  @Get('me')
  @ApiOperation({
    summary: "Récupérer les actualités pour l'utilisateur connecté",
  })
  getMyActualites(@CurrentUser() user: any) {
    return this.actualiteService.getActualitesForUser(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une actualité par ID' })
  findOne(@Param('id') id: string) {
    return this.actualiteService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une actualité' })
  update(
    @Param('id') id: string,
    @Body() updateActualiteDto: UpdateActualiteDto,
    @CurrentUser() user: any,
  ) {
    return this.actualiteService.update(
      id,
      updateActualiteDto,
      user.id,
      user.role,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une actualité' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.actualiteService.remove(id, user.id, user.role);
  }
}
