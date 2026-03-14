import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { OrderStatus } from "../constants/orderStatus";
import { getStatusBadgeClass } from "../constants/orderStatus";
import { useAuth } from "../hooks/useAuth";
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
  payment?: Payment[];
};

async function fetchOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}
async function fetchPayments(orderId: string) {
  const { data } = await api.get<Payment[]>(`/payments/order/${orderId}`);
  return data;
}
async function createPayment(orderId: string, provider: string) {
  const { data } = await api.post<{ paymentId: string }>("/payments", {
    orderId,
    provider,
  });
  return data;
}
async function confirmPayment(paymentId: string) {
  const { data } = await api.patch("/payments/status", {
    paymentId,
    status: "SUCCESS",
  });
  return data;
}
async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await api.patch<Order>(`/orders/${orderId}/status`, {
    status,
  });
  return data;
}

const statusBadgeClass = getStatusBadgeClass;

const canManagePayment = (roles: string[] | undefined) =>
  roles?.some((r) => r === "ADMIN" || r === "MANAGER" || r === "CASHIER") ??
  false;

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [paymentProvider, setPaymentProvider] = useState("CASH");

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["payments", id],
    queryFn: () => fetchPayments(id!),
    enabled: !!id,
  });

  const createPaymentMutation = useMutation({
    mutationFn: () => createPayment(id!, paymentProvider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
    },
  });
  const confirmPaymentMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
    },
  });
  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id!, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["orders", id] }),
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
          to="/orders"
          className="btn btn-secondary"
          style={{ marginTop: "1rem", display: "inline-block" }}
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusFlow: OrderStatus[] = [
    "NEW",
    "IN_KITCHEN",
    "READY",
    "SERVED",
    "PAID",
  ];
  const canProgress = order.status !== "PAID" && order.status !== "CANCELLED";
  const canCancel =
    order.status !== "PAID" &&
    order.status !== "CANCELLED" &&
    order.status !== "OUT_FOR_DELIVERY";
  const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1];

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
            to="/orders"
            style={{
              color: "#94a3b8",
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
          className={statusBadgeClass(order.status)}
          style={{ fontSize: "1rem" }}
        >
          {order.status}
        </span>
      </div>

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          background: "rgba(30, 41, 59, 0.6)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
        }}
      >
        <h2 style={{ color: "#e2e8f0", marginTop: 0 }}>Items</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {order.items.map((i) => (
            <li
              key={i.id}
              style={{
                padding: "0.5rem 0",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "#e2e8f0" }}>
                {i.menuItem.name} ×{i.quantity}{" "}
                {i.notes && (
                  <span style={{ color: "#94a3b8" }}>({i.notes})</span>
                )}
              </span>
              <span style={{ color: "#86efac" }}>
                ${(Number(i.unitPrice) * i.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 600,
              color: "#f8fafc",
            }}
          >
            <span>Total</span>
            <span style={{ color: "#86efac" }}>${order.grandTotal}</span>
          </div>
        </div>
      </div>

      {(canProgress || canCancel) && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {canProgress && nextStatus && (
            <button
              className="btn btn-primary"
              onClick={() => statusMutation.mutate(nextStatus)}
              disabled={statusMutation.isPending}
            >
              Mark as {nextStatus}
            </button>
          )}
          {canCancel && (
            <button
              className="btn btn-danger"
              onClick={() => statusMutation.mutate("CANCELLED")}
              disabled={statusMutation.isPending}
            >
              Cancel Order
            </button>
          )}
        </div>
      )}

      {canManagePayment(user?.roles) && order.status !== "PAID" && (
        <div
          className="card"
          style={{
            marginTop: "1.5rem",
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <h2 style={{ color: "#e2e8f0", marginTop: 0 }}>Payment</h2>
          {payments.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {payments.map((p) => (
                <li
                  key={p.id}
                  style={{
                    padding: "0.5rem 0",
                    color: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <span>
                    {p.provider} – ${p.amount} – {p.status}
                  </span>
                  {p.status === "PENDING" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => confirmPaymentMutation.mutate(p.id)}
                      disabled={confirmPaymentMutation.isPending}
                    >
                      Confirm Paid
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <select
                className="form-select"
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="CASH">Cash</option>
                <option value="CARD_TERMINAL">Card Terminal</option>
                <option value="STRIPE">Stripe</option>
                <option value="PAYPAL">PayPal</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={() => createPaymentMutation.mutate()}
                disabled={createPaymentMutation.isPending}
              >
                {createPaymentMutation.isPending
                  ? "Creating…"
                  : "Create Payment"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
