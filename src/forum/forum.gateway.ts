/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ForumService } from './forum.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'forum',
})
export class ForumGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(
    private jwtService: JwtService,
    private forumService: ForumService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Stocker la connexion
      const socketIds = this.userSockets.get(userId) || [];
      socketIds.push(client.id);
      this.userSockets.set(userId, socketIds);

      // Joindre la room personnelle
      client.join(`user:${userId}`);

      console.log(`User ${userId} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Supprimer la connexion
    for (const [userId, socketIds] of this.userSockets.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index !== -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, socketIds);
        }
        break;
      }
    }
  }

  @SubscribeMessage('joinTopic')
  handleJoinTopic(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { topicId: string },
  ) {
    client.join(`topic:${data.topicId}`);
  }

  @SubscribeMessage('leaveTopic')
  handleLeaveTopic(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { topicId: string },
  ) {
    client.leave(`topic:${data.topicId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { topicId: string; message: CreateMessageDto; userId: string },
  ) {
    const result = await this.forumService.createMessage(
      data.topicId,
      data.message,
      data.userId,
    );

    // Envoyer le message à tous les participants du topic
    this.server.to(`topic:${data.topicId}`).emit('newMessage', result);

    // Notifier les utilisateurs mentionnés
    for (const mention of result.mentions) {
      if (mention.userId) {
        this.server.to(`user:${mention.userId}`).emit('newMention', {
          messageId: result.message.id,
          topicId: data.topicId,
          auteur: result.message.auteur,
          contenu: result.message.contenu,
        });
      }
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { topicId: string; userId: string; isTyping: boolean },
  ) {
    client.to(`topic:${data.topicId}`).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }
}
