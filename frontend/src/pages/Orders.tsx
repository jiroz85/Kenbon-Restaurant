import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { OrderStatus } from "../constants/orderStatus";
import { getStatusBadgeClass } from "../constants/orderStatus";

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

type Table = { id: string; label: string; capacity: number; isActive: boolean };
type MenuItem = {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
  category?: { name: string };
};
type OrderItem = {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: string;
  notes?: string;
};
type Order = {
  id: string;
  type: OrderType;
  status: OrderStatus;
  table?: { id: string; label: string };
  items: OrderItem[];
  grandTotal: string;
  createdAt: string;
  customerName?: string;
};

async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders");
  return data;
}
async function fetchTables(): Promise<Table[]> {
  const { data } = await api.get<Table[]>("/tables");
  return data;
}
async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data } = await api.get<MenuItem[]>("/menu/items");
  return data;
}
async function createOrder(payload: {
  type: OrderType;
  tableId?: string;
  items: { menuItemId: string; quantity: number; notes?: string }[];
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
}) {
  const { data } = await api.post<Order>("/orders", payload);
  return data;
}
async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await api.patch<Order>(`/orders/${orderId}/status`, {
    status,
  });
  return data;
}

const statusBadgeClass = getStatusBadgeClass;

export function Orders() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [formType, setFormType] = useState<OrderType>("DINE_IN");
  const [formTableId, setFormTableId] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formItems, setFormItems] = useState<
    { menuItemId: string; quantity: number }[]
  >([]);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });
  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
  });
  const { data: menuItems } = useQuery({
    queryKey: ["menu", "items"],
    queryFn: fetchMenuItems,
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowCreate(false);
      setFormItems([]);
      setFormTableId("");
      setFormCustomer("");
      setFormPhone("");
      setFormAddress("");
    },
    onError: (err: {
      response?: { data?: { message?: string | string[] } };
    }) => {
      const msg = err.response?.data?.message;
      setFormError(
        Array.isArray(msg) ? msg[0] : msg || "Failed to create order",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const addItem = () => {
    const first = menuItems?.find((m) => m.isAvailable);
    if (first)
      setFormItems((prev) => [...prev, { menuItemId: first.id, quantity: 1 }]);
  };
  const updateItem = (
    idx: number,
    field: "menuItemId" | "quantity",
    value: string | number,
  ) => {
    setFormItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const removeItem = (idx: number) =>
    setFormItems((prev) => prev.filter((_, i) => i !== idx));

  const handleCreate = () => {
    setFormError(null);
    if (formItems.length === 0) {
      setFormError("Add at least one item");
      return;
    }
    if (formType === "DINE_IN" && !formTableId) {
      setFormError("Select a table for dine-in");
      return;
    }
    if (formType === "DELIVERY" && (!formPhone || !formAddress)) {
      setFormError("Phone and address are required for delivery orders");
      return;
    }
    createMutation.mutate({
      type: formType,
      tableId: formType === "DINE_IN" ? formTableId : undefined,
      items: formItems,
      customerName: formCustomer || undefined,
      customerPhone: formType === "DELIVERY" ? formPhone : undefined,
      deliveryAddress: formType === "DELIVERY" ? formAddress : undefined,
    });
  };

  const statusFlow: OrderStatus[] = [
    "NEW",
    "IN_KITCHEN",
    "READY",
    "SERVED",
    "PAID",
  ];
  const canProgress = (order: Order) => {
    const i = statusFlow.indexOf(order.status);
    return i >= 0 && i < statusFlow.length - 1 && order.status !== "CANCELLED";
  };
  const canCancel = (order: Order) =>
    order.status !== "PAID" &&
    order.status !== "CANCELLED" &&
    order.status !== "OUT_FOR_DELIVERY";
  const nextStatus = (order: Order) => {
    const i = statusFlow.indexOf(order.status);
    return i >= 0 && i < statusFlow.length - 1
      ? statusFlow[i + 1]
      : order.status;
  };

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-lead">View and manage orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Order
        </button>
      </div>

      {showCreate && (
        <div
          className="card"
          style={{
            marginTop: "1.5rem",
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <h2 style={{ color: "#e2e8f0", marginTop: 0 }}>Create Order</h2>
          <div className="form-group">
            <label className="form-label">Order Type</label>
            <select
              className="form-select"
              value={formType}
              onChange={(e) => setFormType(e.target.value as OrderType)}
            >
              <option value="DINE_IN">Dine-in</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>
          {formType === "DINE_IN" && (
            <div className="form-group">
              <label className="form-label">Table</label>
              <select
                className="form-select"
                value={formTableId}
                onChange={(e) => setFormTableId(e.target.value)}
              >
                <option value="">Select table</option>
                {tables
                  ?.filter((t) => t.isActive)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.capacity} seats)
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Customer Name (optional)</label>
            <input
              type="text"
              className="form-input"
              value={formCustomer}
              onChange={(e) => setFormCustomer(e.target.value)}
              placeholder="Customer name"
            />
          </div>
          {formType === "DELIVERY" && (
            <>
              <div className="form-group">
                <label className="form-label">Customer Phone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Phone number"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <textarea
                  className="form-textarea"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Full delivery address"
                  rows={3}
                  required
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Items</label>
            {formItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  alignItems: "center",
                }}
              >
                <select
                  className="form-select"
                  value={item.menuItemId}
                  onChange={(e) =>
                    updateItem(idx, "menuItemId", e.target.value)
                  }
                  style={{ flex: 2 }}
                >
                  {menuItems
                    ?.filter((m) => m.isAvailable)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} – ${m.price}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  className="form-input"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      "quantity",
                      parseInt(e.target.value, 10) || 1,
                    )
                  }
                  min={1}
                  style={{ width: "80px" }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => removeItem(idx)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={addItem}>
              + Add item
            </button>
          </div>
          {formError && <p className="error-msg">{formError}</p>}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create Order"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="page-lead" style={{ marginTop: "1.5rem" }}>
          Loading orders…
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Table</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link
                      to={`/orders/${o.id}`}
                      style={{ color: "#38bdf8", textDecoration: "underline" }}
                    >
                      {o.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td>{o.type}</td>
                  <td>{o.table?.label ?? "–"}</td>
                  <td>
                    {o.items
                      .map((i) => `${i.menuItem.name} ×${i.quantity}`)
                      .join(", ")}
                  </td>
                  <td>${o.grandTotal}</td>
                  <td>
                    <span className={statusBadgeClass(o.status)}>
                      {o.status}
                    </span>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {canProgress(o) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            statusMutation.mutate({
                              id: o.id,
                              status: nextStatus(o),
                            })
                          }
                          disabled={statusMutation.isPending}
                        >
                          → {nextStatus(o)}
                        </button>
                      )}
                      {canCancel(o) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            statusMutation.mutate({
                              id: o.id,
                              status: "CANCELLED",
                            })
                          }
                          disabled={statusMutation.isPending}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      color: "#94a3b8",
                      textAlign: "center",
                      padding: "2rem",
                    }}
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
