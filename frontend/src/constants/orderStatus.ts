export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_KITCHEN"
  | "READY"
  | "SERVED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_BADGES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "badge-pending",
  PAID: "badge-paid",
  IN_KITCHEN: "badge-kitchen",
  READY: "badge-ready",
  SERVED: "badge-served",
  OUT_FOR_DELIVERY: "badge-delivery",
  DELIVERED: "badge-delivered",
  CANCELLED: "badge-cancelled",
};

export function getStatusBadgeClass(status: string): string {
  return `badge ${ORDER_STATUS_BADGES[status as OrderStatus] || "badge-default"}`;
}
