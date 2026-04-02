/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags(' Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users
  @Get()
  @ApiOperation({ summary: 'Liste tous les utilisateurs' })
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/search?q=Ahmed   ← pour l'autocomplétion @mentions
  @Get('search')
  @ApiOperation({
    summary: 'Recherche par username (autocomplétion @mentions)',
  })
  @ApiQuery({ name: 'q', description: 'Début du username' })
  search(@Query('q') q: string) {
    return this.usersService.searchByUsername(q ?? '');
  }

  // GET /users/:id
  @Get(':id')
  @ApiOperation({ summary: "Profil d'un utilisateur" })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // PATCH /users/me
  @Patch('me')
  @ApiOperation({ summary: 'Modifier mon profil' })
  updateMe(@CurrentUser() user: any, @Body() dto: any) {
    const { password, role, email, ...safe } = dto; // champs non modifiables
    return this.usersService.updateProfile(user.id, safe);
  }

  //   // PATCH /users/:id/toggle  ← admin uniquement
  //   @Patch(':id/toggle')
  //   @UseGuards(RolesGuard)
  //   @Roles('admin')
  //   @ApiOperation({ summary: 'Activer/désactiver un utilisateur (admin)' })
  //   toggle(@Param('id') id: string, @Body() dto: { isActive: boolean }) {
  //     return this.usersService.toggleActive(id, dto.isActive);
  //   }
}
