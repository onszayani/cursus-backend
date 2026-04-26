/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // ── THREADS ─────────────────────────────────────────────────────────

  // GET /forum/threads - Tous les threads accessibles à l'utilisateur
  @Get('threads')
  @ApiOperation({ summary: 'Liste tous les threads accessibles' })
  getUserThreads(@CurrentUser() user: any) {
    return this.forumService.getUserThreads(user.id);
  }

  // POST /forum/threads - Créer un nouveau thread (ou récupérer l'existant)
  @Post('threads')
  @ApiOperation({ summary: "Créer un nouveau thread ou récupérer l'existant" })
  createOrGetThread(@CurrentUser() user: any, @Body() dto: CreateThreadDto) {
    return this.forumService.createOrGetThread(dto, user.id);
  }
  @Get('threads/my')
  @ApiOperation({ summary: 'Mes threads (créés + où je suis destinataire)' })
  getMyThreads(@CurrentUser() user: any) {
    return this.forumService.getUserThreads(user.id);
  }

  // GET /forum/threads/:id
  @Get('threads/:id')
  @ApiOperation({ summary: "Détails d'un thread" })
  getThread(@Param('id') id: string) {
    return this.forumService.getThreadById(id);
  }

  // DELETE /forum/threads/:id
  @Delete('threads/:id')
  @ApiOperation({ summary: 'Supprimer un thread' })
  deleteThread(@Param('id') id: string, @CurrentUser() user: any) {
    return this.forumService.deleteThread(id, user.id);
  }

  // ── MESSAGES ────────────────────────────────────────────────────────

  // GET /forum/threads/:id/messages
  @Get('threads/:id/messages')
  @ApiOperation({ summary: "Messages d'un thread" })
  getMessages(@Param('id') threadId: string, @CurrentUser() user: any) {
    return this.forumService.getMessages(threadId, user.id);
  }

  // POST /forum/threads/:id/messages
  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message dans le thread' })
  sendMessage(
    @Param('id') threadId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.forumService.sendMessage(threadId, user.id, dto);
  }
}
