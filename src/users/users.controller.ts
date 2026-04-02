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
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignGroupeDto } from './dto/assign-groupe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      role,
    });
  }

  @Get('profile')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/groupes')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assigner un étudiant à un groupe' })
  assignGroupe(
    @Param('id') id: string,
    @Body() assignGroupeDto: AssignGroupeDto,
  ) {
    return this.usersService.assignGroupe(id, assignGroupeDto);
  }

  @Delete(':id/groupes/:groupeId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Retirer un étudiant d'un groupe" })
  removeGroupe(@Param('id') id: string, @Param('groupeId') groupeId: string) {
    return this.usersService.removeGroupe(id, groupeId);
  }

  @Get(':id/groupes')
  @ApiOperation({ summary: "Récupérer les groupes d'un utilisateur" })
  getGroupes(@Param('id') id: string) {
    return this.usersService.getGroupes(id);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Modifier le mot de passe' })
  updatePassword(
    @Param('id') id: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.updatePassword(id, currentPassword, newPassword);
  }

  @Patch(':id/toggle-activation')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activer/désactiver un compte utilisateur' })
  toggleActivation(@Param('id') id: string) {
    return this.usersService.toggleActivation(id);
  }
}
