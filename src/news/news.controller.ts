/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('News')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // GET /news  → filtré selon le rôle
  @Get()
  @ApiOperation({
    summary: 'Mes actualités (filtrées par groupe pour les étudiants)',
  })
  findAll(@CurrentUser() user: any) {
    return this.newsService.findForUser(
      user.role === 'student' ? user.studentGroup : undefined,
    );
  }

  // GET /news/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findById(id);
  }

  // POST /news  (admin ou enseignant)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Publier une actualité' })
  create(@CurrentUser() user: any, @Body() dto: CreateNewsDto) {
    return this.newsService.create(dto, user.id);
  }

  // PATCH /news/:id
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateNewsDto>,
    @CurrentUser() user: any,
  ) {
    return this.newsService.update(id, dto, user.id, user.role);
  }

  // DELETE /news/:id
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.newsService.remove(id, user.id, user.role);
  }
}
