import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Order } from '../database/entities/order.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  emitOrderCreated(order: Order) {
    this.server.emit('order.created', order);
  }

  emitOrderStatusUpdated(order: Order) {
    this.server.emit('order.statusUpdated', order);
  }
}
