import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/promo',
})
export class PromoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  
  private logger = new Logger(PromoGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Promo Gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Promo Gateway: ${client.id}`);
  }

  broadcastPromos(promos: any[]) {
    this.server.emit('promo:update', promos);
  }
}
