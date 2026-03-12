import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { OrderStatus } from "../constants/orderStatus";
import { getStatusBadgeClass } from "../constants/orderStatus";
import { getSocket } from "../lib/socket";

type OrderItem = {
  id: string;
  menuItem: { name: string };
  quantity: number;
  notes?: string;
};
type Order = {
  id: string;
  type: string;
  status: OrderStatus;
  table?: { label: string };
  items: OrderItem[];
  grandTotal: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
};

async function fetchDeliveryOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders/status/READY");
  const outForDelivery = await api.get<Order[]>(
    "/orders/status/OUT_FOR_DELIVERY",
  );
  return [...(data || []), ...(outForDelivery.data || [])];
}

async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await api.patch<Order>(`/orders/${orderId}/status`, {
    status,
  });
  return data;
}

const statusBadgeClass = getStatusBadgeClass;

export function Delivery() {
  const queryClient = useQueryClient();

  const { data: orders = [], refetch } = useQuery({
    queryKey: ["orders", "delivery"],
    queryFn: fetchDeliveryOrders,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["orders", "delivery"] }),
  });

  useEffect(() => {
    const socket = getSocket();
    const onUpdated = () => refetch();

    socket.on("order.statusUpdated", onUpdated);
    return () => {
      socket.off("order.statusUpdated", onUpdated);
    };
  }, [refetch]);

  const markOutForDelivery = (id: string) =>
    statusMutation.mutate({ id, status: "OUT_FOR_DELIVERY" });
  const markDelivered = (id: string) =>
    statusMutation.mutate({ id, status: "PAID" });

  const readyOrders = orders.filter((o) => o.status === "READY");
  const outForDeliveryOrders = orders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY",
  );

  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="page">
      <h1 className="page-title">Delivery Dashboard</h1>
      <p className="page-lead">
        Manage delivery orders — ready orders and deliveries in progress
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="dashboard-card">
          <span className="dashboard-card-label">Ready for Delivery</span>
          <span className="dashboard-card-value">{readyOrders.length}</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">Out for Delivery</span>
          <span className="dashboard-card-value">
            {outForDeliveryOrders.length}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "1rem",
        }}
      >
        {sorted.map((order) => (
          <div key={order.id} className="dashboard-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ fontWeight: 600, color: "#f8fafc" }}>
                {order.type} • {order.id.slice(0, 8)}
              </span>
              <span className={statusBadgeClass(order.status)}>
                {order.status}
              </span>
            </div>

            {order.customerName && (
              <div style={{ marginBottom: "0.5rem" }}>
                <strong style={{ color: "#e2e8f0" }}>Customer:</strong>{" "}
                <span style={{ color: "#94a3b8" }}>{order.customerName}</span>
              </div>
            )}

            {order.customerPhone && (
              <div style={{ marginBottom: "0.5rem" }}>
                <strong style={{ color: "#e2e8f0" }}>Phone:</strong>{" "}
                <span style={{ color: "#94a3b8" }}>{order.customerPhone}</span>
              </div>
            )}

            {order.deliveryAddress && (
              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ color: "#e2e8f0" }}>Address:</strong>{" "}
                <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  {order.deliveryAddress}
                </span>
              </div>
            )}

            <div
              style={{
                marginBottom: "1rem",
                fontSize: "0.9rem",
                color: "#94a3b8",
              }}
            >
              {order.items
                .map((i) => `${i.menuItem.name} ×${i.quantity}`)
                .join(", ")}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <span style={{ color: "#e2e8f0" }}>Total:</span>
              <span style={{ color: "#86efac", fontWeight: 600 }}>
                ${order.grandTotal}
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {order.status === "READY" && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => markOutForDelivery(order.id)}
                  disabled={statusMutation.isPending}
                >
                  Start Delivery
                </button>
              )}
              {order.status === "OUT_FOR_DELIVERY" && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => markDelivered(order.id)}
                  disabled={statusMutation.isPending}
                >
                  Mark Delivered
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <p
          className="page-lead"
          style={{ marginTop: "2rem", color: "#94a3b8", textAlign: "center" }}
        >
          No delivery orders
        </p>
      )}
    </div>
  );
}
