import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getStatusBadgeClass, type OrderStatus } from "../constants/orderStatus";
import "./OrderDetail.css";

type OrderItem = {
  id: string;
  menuItem: { name: string };
  quantity: number;
  unitPrice: string;
  notes?: string;
};
type Payment = { id: string; amount: string; status: string; provider: string };
type Order = {
  id: string;
  type: string;
  status: OrderStatus;
  table?: { label: string };
  items: OrderItem[];
  subtotal: string;
  grandTotal: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  payment?: Payment[];
};

async function fetchOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  });

  if (!id) {
    return <Navigate to="/orders" replace />;
  }
  if (isLoading || !order) {
    return (
      <div className="page">
        <p className="page-lead">Loading order…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page">
        <p className="page-lead" style={{ color: "#f87171" }}>
          Order not found
        </p>
        <Link
          to="/dashboard/orders"
          className="btn btn-secondary"
          style={{ marginTop: "1rem", display: "inline-block" }}
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <Link
            to="/dashboard/orders"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              display: "inline-block",
            }}
          >
            ← Back to Orders
          </Link>
          <h1 className="page-title">Order {order.id.slice(0, 8)}</h1>
          <p className="page-lead">
            {order.type} • {order.table?.label ?? "–"} •{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={getStatusBadgeClass(order.status)}
          style={{ fontSize: "1rem" }}
        >
          {order.status}
        </span>
      </div>

      {/* Customer Information Section */}
      {(order.customerName || order.customerPhone || order.deliveryAddress) && (
        <div
          className="card"
          style={{
            marginTop: "1.5rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2 style={{ color: "var(--text-heading)", marginTop: 0 }}>
            Customer Information
          </h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {order.customerName && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Name:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {order.customerName}
                </span>
              </div>
            )}
            {order.customerPhone && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Phone:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {order.customerPhone}
                </span>
              </div>
            )}
            {order.deliveryAddress && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Delivery Address:</span>
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    textAlign: "right",
                    maxWidth: "60%",
                  }}
                >
                  {order.deliveryAddress}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <h2 style={{ color: "var(--text-heading)", marginTop: 0 }}>Items</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {order.items.map((i) => (
            <li
              key={i.id}
              style={{
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "var(--text-primary)" }}>
                {i.menuItem.name} ×{i.quantity}{" "}
                {i.notes && (
                  <span style={{ color: "var(--text-muted)" }}>({i.notes})</span>
                )}
              </span>
              <span style={{ color: "var(--price-color)" }}>
                ETB {(Number(i.unitPrice) * i.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 600,
              color: "var(--text-heading)",
            }}
          >
            <span>Total</span>
            <span style={{ color: "var(--price-color)" }}>ETB {order.grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
