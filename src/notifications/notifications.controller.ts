/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('🔔 Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  // GET /notifications
  @Get()
  @ApiOperation({ summary: 'Mes notifications (50 dernières)' })
  findAll(@CurrentUser() user: any) {
    return this.notifService.findForUser(user.id);
  }

  // GET /notifications/unread-count
  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  unreadCount(@CurrentUser() user: any) {
    return this.notifService.countUnread(user.id);
  }

  // PATCH /notifications/:id/read
  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(@Param('id') id: string) {
    return this.notifService.markAsRead(id);
  }

  // PATCH /notifications/read-all
  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes comme lues' })
  markAllRead(@CurrentUser() user: any) {
    return this.notifService.markAllAsRead(user.id);
  }

  // DELETE /notifications/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  delete(@Param('id') id: string) {
    return this.notifService.delete(id);
  }
}
