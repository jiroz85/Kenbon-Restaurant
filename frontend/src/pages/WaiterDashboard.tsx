import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import "../styles/WaiterDashboard.css";

type Order = {
  id: string;
  type: string;
  status: string;
  total: string;
  customerName?: string;
  customerId?: string;
  tableId?: string;
  deliveryAddress?: string;
  customerPhone?: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    menuItem: {
      name: string;
      price: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
};

export function WaiterDashboard() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch all orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const { data } = await api.get<Order[]>("/orders");
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      await api.patch(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "all"] });
      setSelectedOrder(null);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "NEW":
        return "#f59e0b";
      case "IN_KITCHEN":
        return "#3b82f6";
      case "READY":
        return "#22c55e";
      case "SERVED":
        return "#06b6d4";
      case "OUT_FOR_DELIVERY":
        return "#8b5cf6";
      case "PAID":
        return "#10b981";
      case "CANCELLED":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus.mutate({ orderId, status: newStatus });
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  const pendingOrders = orders.filter((order) => order.status === "NEW");
  const activeOrders = orders.filter((order) =>
    ["IN_KITCHEN", "READY", "SERVED", "OUT_FOR_DELIVERY"].includes(
      order.status,
    ),
  );

  if (isLoading) {
    return (
      <div className="page">
        <h1 className="page-title">Waiter Dashboard</h1>
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Waiter Dashboard</h1>
      <p className="page-lead">Manage and track customer orders in real-time</p>

      {/* New Orders Alert */}
      {pendingOrders.length > 0 && (
        <div className="new-orders-alert">
          <span className="alert-icon">🔔</span>
          <span>
            {pendingOrders.length} new order
            {pendingOrders.length > 1 ? "s" : ""} waiting for confirmation
          </span>
        </div>
      )}

      <div className="waiter-dashboard-grid">
        {/* Orders List */}
        <div className="orders-section">
          <div className="section-header">
            <h2>Active Orders</h2>
            <span className="order-count">
              {activeOrders.length + pendingOrders.length}
            </span>
          </div>

          <div className="orders-list">
            {[...pendingOrders, ...activeOrders].map((order) => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? "selected" : ""}`}
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">#{order.id}</span>
                    <span className="order-customer">
                      {order.customerName || "Guest"}
                    </span>
                    {order.tableId && (
                      <span className="table-info">Table {order.tableId}</span>
                    )}
                  </div>
                  <div
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </div>
                </div>

                <div className="order-summary">
                  <span className="order-items">
                    {order.items.length} items
                  </span>
                  <span className="order-total">${order.total}</span>
                  <span className="order-time">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details-section">
          {selectedOrder ? (
            <div className="order-details-panel">
              <div className="details-header">
                <h3>Order #{selectedOrder.id}</h3>
                <button
                  className="btn-close"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </button>
              </div>

              <div className="customer-info">
                <h4>Customer Information</h4>
                <p>
                  <strong>Name:</strong> {selectedOrder.customerName || "Guest"}
                </p>
                {selectedOrder.tableId && (
                  <p>
                    <strong>Table:</strong> {selectedOrder.tableId}
                  </p>
                )}
                {selectedOrder.deliveryAddress && (
                  <p>
                    <strong>Delivery Address:</strong>{" "}
                    {selectedOrder.deliveryAddress}
                  </p>
                )}
                {selectedOrder.customerPhone && (
                  <p>
                    <strong>Phone:</strong> {selectedOrder.customerPhone}
                  </p>
                )}
                <p>
                  <strong>Order Type:</strong> {selectedOrder.type}
                </p>
                <p>
                  <strong>Order Time:</strong>{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="order-items">
                <h4>Order Items</h4>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.menuItem.name}</span>
                      <span className="item-quantity">×{item.quantity}</span>
                    </div>
                    <span className="item-price">${item.menuItem.price}</span>
                    {item.notes && (
                      <div className="item-notes">Notes: {item.notes}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="order-total-section">
                <strong>Total: ${selectedOrder.total}</strong>
              </div>

              <div className="order-actions">
                {selectedOrder.status === "NEW" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() =>
                        handleStatusUpdate(selectedOrder.id, "IN_KITCHEN")
                      }
                      disabled={updateOrderStatus.isPending}
                    >
                      Start Preparation
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        handleStatusUpdate(selectedOrder.id, "CANCELLED")
                      }
                      disabled={updateOrderStatus.isPending}
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                {selectedOrder.status === "IN_KITCHEN" && (
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      handleStatusUpdate(selectedOrder.id, "READY")
                    }
                    disabled={updateOrderStatus.isPending}
                  >
                    Mark as Ready
                  </button>
                )}

                {selectedOrder.status === "READY" && (
                  <>
                    {selectedOrder.type === "DELIVERY" ? (
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            "OUT_FOR_DELIVERY",
                          )
                        }
                        disabled={updateOrderStatus.isPending}
                      >
                        Out for Delivery
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          handleStatusUpdate(selectedOrder.id, "SERVED")
                        }
                        disabled={updateOrderStatus.isPending}
                      >
                        Mark as Served
                      </button>
                    )}
                  </>
                )}

                {selectedOrder.status === "OUT_FOR_DELIVERY" && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate(selectedOrder.id, "PAID")}
                    disabled={updateOrderStatus.isPending}
                  >
                    Mark as Delivered & Paid
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="no-order-selected">
              <div className="placeholder-icon">📋</div>
              <p>Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
