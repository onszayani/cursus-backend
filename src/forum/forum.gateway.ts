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
  namespace: '/forum', // URL: ws://localhost:3000/forum
  cors: { origin: '*', credentials: true },
})
export class ForumGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ForumGateway.name);

  // Map userId → socketId (pour les notifications ciblées)
  private connectedUsers = new Map<string, string>();

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private forumService: ForumService,
    private notifService: NotificationsService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway /forum initialisé');
  }

  // ── CONNEXION ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/require-await
  async handleConnection(client: Socket) {
    try {
      // Récupérer le token depuis les headers ou auth
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      // Stocker les infos de l'utilisateur sur le socket
      client.data.userId = payload.sub;
      client.data.userRole = payload.role;
      client.data.email = payload.email;

      // Enregistrer la connexion
      this.connectedUsers.set(payload.sub, client.id);
      this.logger.log(`User ${payload.email} connecté (socket: ${client.id})`);

      client.emit('connected', { message: 'Connecté au forum WebSocket' });
    } catch (err) {
      if (err instanceof Error) {
        this.logger.warn(`Connexion rejetée: ${err.message}`);
      } else {
        this.logger.warn(`Connexion rejetée: ${String(err)}`);
      }
      client.disconnect();
    }
  }

  // ── DÉCONNEXION ─────────────────────────────────────────────────────
  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      this.connectedUsers.delete(client.data.userId);
      this.logger.log(`User ${client.data.email} déconnecté`);
    }
  }

  // ── REJOINDRE UN THREAD ─────────────────────────────────────────────
  // Client envoie: socket.emit('joinThread', 'thread-uuid')
  @SubscribeMessage('joinThread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() threadId: string,
  ) {
    await client.join(`thread:${threadId}`);
    this.logger.log(`User ${client.data.email} a rejoint thread:${threadId}`);
    return { event: 'joinedThread', data: { threadId } };
  }

  // ── QUITTER UN THREAD ───────────────────────────────────────────────
  @SubscribeMessage('leaveThread')
  async handleLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() threadId: string,
  ) {
    await client.leave(`thread:${threadId}`);
    return { event: 'leftThread', data: { threadId } };
  }

  // ── ENVOYER UN MESSAGE VIA WEBSOCKET ────────────────────────────────
  // Client envoie: socket.emit('sendMessage', { threadId, content, replyToId? })
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { threadId: string; content: string; replyToId?: string },
  ) {
    if (!client.data?.userId) return;

    // Enregistrer le message (+ déclencher les @mentions automatiquement)
    const message = await this.forumService.sendMessage(
      data.threadId,
      client.data.userId,
      { content: data.content, replyToId: data.replyToId },
    );

    // Diffuser le message à tous les membres du thread
    this.server.to(`thread:${data.threadId}`).emit('newMessage', message);

    return message;
  }

  // ── INDICATEUR 'EN TRAIN D\'ÉCRIRE' ────────────────────────────────
  // Client envoie: socket.emit('typing', { threadId, isTyping: true })
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; isTyping: boolean },
  ) {
    // Diffuser aux autres membres du thread
    client.to(`thread:${data.threadId}`).emit('userTyping', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  // ── MÉTHODE PUBLIQUE pour notifier un user spécifique ───────────────
  // Appelée par NotificationsService après création d'une notification
  sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      this.logger.log(`Notification envoyée à user ${userId}`);
    }
  }

  // Vérifie si un user est en ligne
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
