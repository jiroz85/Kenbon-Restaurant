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
    console.log('RealtimeGateway: Emitting order.statusUpdated event:', {
      orderId: order.id,
      status: order.status,
      createdBy: order.createdBy?.id,
      connectedClients: this.server.engine.clientsCount,
    });

    // Emit to all clients
    const result = this.server.emit('order.statusUpdated', order);
    console.log('RealtimeGateway: Emit result:', result);
  }
}
