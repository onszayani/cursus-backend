/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

interface AuthenticatedUser {
  id: string;
  role: Role;
}

@ApiTags('forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // Topics
  @Post('topics')
  @ApiOperation({ summary: 'Créer un nouveau topic' })
  createTopic(
    @Body() createTopicDto: CreateTopicDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.createTopic(createTopicDto, user.id);
  }

  @Get('topics')
  @ApiOperation({ summary: 'Récupérer tous les topics' })
  findAllTopics(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.forumService.findAllTopics({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('topics/:id')
  @ApiOperation({ summary: 'Récupérer un topic par ID' })
  findTopicById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.findTopicById(id, user.id);
  }

  @Patch('topics/:id/status')
  @ApiOperation({ summary: "Changer le statut d'un topic" })
  updateTopicStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.updateTopicStatus(
      id,
      status,
      user.id,
      user.role as string,
    );
  }

  @Patch('topics/:id/pin')
  @Roles(Role.ADMIN, Role.CHEF_DEPARTEMENT)
  @ApiOperation({ summary: 'Épingler/Désépingler un topic' })
  pinTopic(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.forumService.pinTopic(id, user.id, user.role as string);
  }

  // Messages
  @Post('topics/:topicId/messages')
  @ApiOperation({ summary: 'Ajouter un message dans un topic' })
  createMessage(
    @Param('topicId') topicId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.createMessage(topicId, createMessageDto, user.id);
  }

  // Mentions
  @Get('mentions')
  @ApiOperation({ summary: 'Récupérer les mentions non lues' })
  getMentions(@CurrentUser() user: AuthenticatedUser) {
    return this.forumService.getMentionsForUser(user.id);
  }

  @Patch('mentions/:id/read')
  @ApiOperation({ summary: 'Marquer une mention comme lue' })
  markMentionAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.markMentionAsRead(id, user.id);
  }
}
