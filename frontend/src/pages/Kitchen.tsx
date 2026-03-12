import { useEffect, useState } from "react";
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
};

async function fetchKitchenOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders/status/NEW");
  const kitchen = await api.get<Order[]>("/orders/status/IN_KITCHEN");
  return [...(data || []), ...(kitchen.data || [])];
}
async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await api.patch<Order>(`/orders/${orderId}/status`, {
    status,
  });
  return data;
}

const statusBadgeClass = getStatusBadgeClass;

export function Kitchen() {
  const queryClient = useQueryClient();
  const [newOrderFlash, setNewOrderFlash] = useState<string | null>(null);

  const { data: orders = [], refetch } = useQuery({
    queryKey: ["orders", "kitchen"],
    queryFn: fetchKitchenOrders,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] }),
  });

  useEffect(() => {
    const socket = getSocket();
    const onCreated = (order: Order) => {
      setNewOrderFlash(order.id);
      refetch();
      setTimeout(() => setNewOrderFlash(null), 3000);
    };
    const onUpdated = () => refetch();

    socket.on("order.created", onCreated);
    socket.on("order.statusUpdated", onUpdated);
    return () => {
      socket.off("order.created", onCreated);
      socket.off("order.statusUpdated", onUpdated);
    };
  }, [refetch]);

  const markInKitchen = (id: string) =>
    statusMutation.mutate({ id, status: "IN_KITCHEN" });
  const markReady = (id: string) =>
    statusMutation.mutate({ id, status: "READY" });

  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="page">
      <h1 className="page-title">Kitchen (KDS)</h1>
      <p className="page-lead">
        Real-time order queue — new orders appear automatically
      </p>

      {newOrderFlash && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "rgba(34, 197, 94, 0.2)",
            border: "1px solid rgba(34, 197, 94, 0.5)",
            borderRadius: "0.5rem",
            color: "#86efac",
            marginBottom: "1rem",
            animation: "pulse 1s ease-in-out 3",
          }}
        >
          New order arrived
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        {sorted.map((order) => (
          <div
            key={order.id}
            className="dashboard-card"
            style={{
              border:
                newOrderFlash === order.id ? "2px solid #22c55e" : undefined,
              animation: newOrderFlash === order.id ? "none" : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ fontWeight: 600, color: "#f8fafc" }}>
                {order.table?.label ?? order.type} • {order.id.slice(0, 8)}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span className={statusBadgeClass(order.status)}>
                  {order.status}
                </span>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  {order.type === "DINE_IN"
                    ? `Table ${order.table?.label || "N/A"}`
                    : order.customerName
                      ? order.customerName
                      : `Order #${order.id.slice(0, 8)}`}
                </div>
              </div>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {order.items.map((i) => (
                <li
                  key={i.id}
                  style={{ padding: "0.25rem 0", color: "#e2e8f0" }}
                >
                  <strong>{i.menuItem.name}</strong> ×{i.quantity}
                  {i.notes && (
                    <span style={{ color: "#94a3b8", marginLeft: "0.5rem" }}>
                      — {i.notes}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {order.status === "NEW" && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => markInKitchen(order.id)}
                  disabled={statusMutation.isPending}
                >
                  In Kitchen
                </button>
              )}
              {(order.status === "NEW" || order.status === "IN_KITCHEN") && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => markReady(order.id)}
                  disabled={statusMutation.isPending}
                >
                  Mark Ready
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <p
          className="page-lead"
          style={{ marginTop: "2rem", color: "#94a3b8" }}
        >
          No orders in queue
        </p>
      )}
    </div>
  );
}
