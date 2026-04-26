/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ForumService } from './forum.service';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
  namespace: '/forum',
  cors: { origin: '*', credentials: true },
})
export class ForumGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ForumGateway.name);
  private connectedUsers = new Map<string, string>();
  private userThreads = new Map<string, Set<string>>();

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private forumService: ForumService,
    private notifService: NotificationsService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway /forum initialisé');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connexion refusée: pas de token');
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.userRole = payload.role;
      client.data.userEmail = payload.email;

      this.connectedUsers.set(payload.sub, client.id);
      this.userThreads.set(payload.sub, new Set());

      this.logger.log(`User ${payload.email} connecté (socket: ${client.id})`);

      await this.autoJoinUserThreads(payload.sub, client);

      client.emit('connected', {
        message: 'Connecté au forum WebSocket',
        userId: payload.sub,
      });
    } catch (err) {
      if (err instanceof Error) {
        this.logger.warn(`Connexion rejetée: ${err.message}`);
      } else {
        this.logger.warn(`Connexion rejetée: ${String(err)}`);
      }
      client.disconnect();
    }
  }

  private async autoJoinUserThreads(userId: string, client: Socket) {
    try {
      const threads = await this.forumService.getUserThreads(userId);
      const userThreadSet = this.userThreads.get(userId);

      for (const thread of threads) {
        const roomName = `thread:${thread.id}`;
        await client.join(roomName);
        userThreadSet?.add(thread.id);
        this.logger.debug(`User ${userId} auto-joined ${roomName}`);
      }
    } catch (error) {
      this.logger.error(`Erreur auto-join pour user ${userId}:`, error);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      this.connectedUsers.delete(client.data.userId);
      this.userThreads.delete(client.data.userId);
      this.logger.log(`User ${client.data.userEmail} déconnecté`);
    }
  }

  @SubscribeMessage('joinThread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() threadId: string,
  ) {
    if (!client.data?.userId)
      return { event: 'error', data: { message: 'Non authentifié' } };

    try {
      await this.forumService.checkThreadAccess(threadId, client.data.userId);

      await client.join(`thread:${threadId}`);

      const userThreads = this.userThreads.get(client.data.userId);
      userThreads?.add(threadId);

      this.logger.log(
        `User ${client.data.userEmail} a rejoint thread:${threadId}`,
      );

      return { event: 'joinedThread', data: { threadId } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('leaveThread')
  async handleLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() threadId: string,
  ) {
    if (!client.data?.userId) return;

    await client.leave(`thread:${threadId}`);

    const userThreads = this.userThreads.get(client.data.userId);
    userThreads?.delete(threadId);

    this.logger.log(
      `User ${client.data.userEmail} a quitté thread:${threadId}`,
    );

    return { event: 'leftThread', data: { threadId } };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { threadId: string; content: string; replyToId?: string },
  ) {
    if (!client.data?.userId) {
      return { event: 'error', data: { message: 'Non authentifié' } };
    }

    try {
      const message = await this.forumService.sendMessage(
        data.threadId,
        client.data.userId,
        { content: data.content, replyToId: data.replyToId },
      );

      if (!message) {
        return { event: 'error', data: { message: 'Message non créé' } };
      }

      const thread = await this.forumService.getThreadById(data.threadId);
      const recipients = await this.forumService.getThreadRecipients(thread);

      this.server.to(`thread:${data.threadId}`).emit('newMessage', message);

      for (const recipientId of recipients) {
        if (
          recipientId !== client.data.userId &&
          !this.isUserInThread(recipientId, data.threadId)
        ) {
          this.sendNotificationToUser(recipientId, {
            title: `Nouveau message de ${message.sender.firstName} ${message.sender.lastName}`,
            body: message.content.substring(0, 120),
            threadId: data.threadId,
            messageId: message.id,
          });
        }
      }

      return { event: 'messageSent', data: message };
    } catch (error) {
      this.logger.error(`Erreur envoi message:`, error);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; isTyping: boolean },
  ) {
    if (!client.data?.userId) return;

    client.to(`thread:${data.threadId}`).emit('userTyping', {
      userId: client.data.userId,
      userName: client.data.userEmail,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; messageIds: string[] },
  ) {
    if (!client.data?.userId) return;

    try {
      await this.forumService.markMessagesAsReadByIds(
        data.messageIds,
        client.data.userId,
      );

      client.to(`thread:${data.threadId}`).emit('messagesRead', {
        userId: client.data.userId,
        messageIds: data.messageIds,
      });

      return { event: 'markedAsRead', data: { success: true } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    if (!client.data?.userId) return;

    const onlineUsers = Array.from(this.connectedUsers.keys());
    client.emit('onlineUsers', onlineUsers);
  }

  private isUserInThread(userId: string, threadId: string): boolean {
    const userThreads = this.userThreads.get(userId);
    return userThreads?.has(threadId) || false;
  }

  sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      this.logger.log(`Notification envoyée à user ${userId}`);
    }
  }

  sendNotificationToThread(threadId: string, notification: any) {
    this.server
      .to(`thread:${threadId}`)
      .emit('threadNotification', notification);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
