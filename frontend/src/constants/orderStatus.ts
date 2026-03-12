export type OrderStatus =
  | 'NEW'
  | 'IN_KITCHEN'
  | 'READY'
  | 'SERVED'
  | 'OUT_FOR_DELIVERY'
  | 'PAID'
  | 'CANCELLED';

export const ORDER_STATUS_BADGES: Record<OrderStatus, string> = {
  NEW: 'badge-new',
  IN_KITCHEN: 'badge-kitchen',
  READY: 'badge-ready',
  SERVED: 'badge-served',
  OUT_FOR_DELIVERY: 'badge-delivery',
  PAID: 'badge-paid',
  CANCELLED: 'badge-cancelled',
};

export function getStatusBadgeClass(status: string): string {
  return `badge ${ORDER_STATUS_BADGES[status as OrderStatus] || 'badge-default'}`;
}
