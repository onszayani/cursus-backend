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

@ApiTags('💬 Forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // ── THREADS ─────────────────────────────────────────────────────────

  // GET /forum/threads
  @Get('threads')
  @ApiOperation({ summary: 'Liste tous les threads du forum' })
  getThreads() {
    return this.forumService.getThreads();
  }

  // POST /forum/threads
  @Post('threads')
  @ApiOperation({ summary: 'Créer un nouveau thread' })
  createThread(@CurrentUser() user: any, @Body() dto: CreateThreadDto) {
    return this.forumService.createThread(dto, user.id);
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
  deleteThread(@Param('id') id: string) {
    return this.forumService.deleteThread(id);
  }

  // ── MESSAGES ────────────────────────────────────────────────────────

  // GET /forum/threads/:id/messages
  @Get('threads/:id/messages')
  @ApiOperation({ summary: "Messages d'un thread" })
  getMessages(@Param('id') threadId: string) {
    return this.forumService.getMessages(threadId);
  }

  // POST /forum/threads/:id/messages
  @Post('threads/:id/messages')
  @ApiOperation({
    summary: 'Envoyer un message (supporte @mentions)',
    description:
      'Utilisez @tous, @technicien, @ING_A1_G1, @Ahmed_Ben dans le contenu',
  })
  sendMessage(
    @Param('id') threadId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.forumService.sendMessage(threadId, user.id, dto);
  }
}
