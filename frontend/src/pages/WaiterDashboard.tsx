import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { getSocket } from "../lib/socket";
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
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paidOrderNotifications, setPaidOrderNotifications] = useState<
    string[]
  >([]);

  // Fetch all orders so waiters can see payment status
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

  // WebSocket listener for paid orders
  useEffect(() => {
    const socket = getSocket();

    socket.on("order.statusUpdated", (order: Order) => {
      if (order.status === "PAID") {
        // Show notification for newly paid order
        setPaidOrderNotifications((prev) => [...prev, order.id]);

        // Remove notification after 5 seconds
        setTimeout(() => {
          setPaidOrderNotifications((current) =>
            current.filter((id) => id !== order.id),
          );
        }, 5000);

        // Refresh the paid orders list
        queryClient.invalidateQueries({ queryKey: ["orders", "all"] });
      }
    });

    return () => {
      socket.off("order.statusUpdated");
    };
  }, [queryClient]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING_PAYMENT":
        return "#f59e0b";
      case "PAID":
        return "#10b981";
      case "IN_KITCHEN":
        return "#3b82f6";
      case "READY":
        return "#22c55e";
      case "SERVED":
        return "#06b6d4";
      case "OUT_FOR_DELIVERY":
        return "#8b5cf6";
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

  // Update filtering for new workflow - show both paid and unpaid orders
  const unpaidOrders = orders.filter(
    (order) => order.status === "PENDING_PAYMENT",
  );
  const paidOrders = orders.filter((order) => order.status === "PAID");
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

      {/* Unpaid Orders Alert */}
      {unpaidOrders.length > 0 && (
        <div
          className="new-orders-alert"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            borderLeft: "4px solid #b45309",
          }}
        >
          <h3>💰 Orders Awaiting Payment</h3>
          <p>
            {unpaidOrders.length} order{unpaidOrders.length > 1 ? "s" : ""}{" "}
            waiting for payment processing.
          </p>
        </div>
      )}

      {/* Paid Orders Alert */}
      {paidOrderNotifications.length > 0 && (
        <div className="new-orders-alert">
          <h3>💰 New Paid Orders Ready for Preparation!</h3>
          <p>
            Orders #{paidOrderNotifications.join(", #")} have been paid and are
            ready to start preparation.
          </p>
        </div>
      )}

      {/* Paid Orders Ready */}
      {paidOrders.length > 0 && paidOrderNotifications.length === 0 && (
        <div
          className="new-orders-alert"
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            borderLeft: "4px solid #047857",
          }}
        >
          <h3>✅ Paid Orders Ready</h3>
          <p>
            {paidOrders.length} paid order{paidOrders.length > 1 ? "s" : ""}{" "}
            ready to start preparation.
          </p>
        </div>
      )}

      {/* New Orders Alert */}
      {unpaidOrders.length === 0 &&
        paidOrders.length === 0 &&
        activeOrders.length === 0 && (
          <div
            className="new-orders-alert"
            style={{
              background: "linear-gradient(135deg, #6b7280, #4b5563)",
              borderLeft: "4px solid #374151",
            }}
          >
            <h3>📋 No Orders</h3>
            <p>No orders at the moment.</p>
          </div>
        )}

      <div className="waiter-dashboard-grid">
        {/* Orders List */}
        <div className="orders-section">
          <div className="section-header">
            <h2>All Orders</h2>
            <span className="order-count">{orders.length}</span>
          </div>

          <div className="orders-list">
            {orders.map((order) => (
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
                    {/* Payment Status Indicator */}
                    {order.status === "PENDING_PAYMENT" && (
                      <span className="payment-status unpaid">
                        💰 Awaiting Payment
                      </span>
                    )}
                    {order.status === "PAID" && (
                      <span className="payment-status paid">✅ Paid</span>
                    )}
                  </div>
                  <div
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status === "PENDING_PAYMENT"
                      ? "Awaiting Payment"
                      : order.status === "PAID"
                        ? "Paid"
                        : order.status === "IN_KITCHEN"
                          ? "In Kitchen"
                          : order.status === "READY"
                            ? "Ready"
                            : order.status === "SERVED"
                              ? "Served"
                              : order.status === "OUT_FOR_DELIVERY"
                                ? "Out for Delivery"
                                : order.status}
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
                {/* Only waiters can start preparation from PAID orders */}
                {selectedOrder.status === "PAID" &&
                  user?.roles?.includes("WAITER") && (
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
                        className="btn btn-secondary"
                        onClick={() => setSelectedOrder(null)}
                      >
                        Close
                      </button>
                    </>
                  )}

                {/* Only kitchen can mark as ready from IN_KITCHEN orders */}
                {selectedOrder.status === "IN_KITCHEN" &&
                  user?.roles?.includes("KITCHEN") && (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() =>
                          handleStatusUpdate(selectedOrder.id, "READY")
                        }
                        disabled={updateOrderStatus.isPending}
                      >
                        Mark as Ready
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedOrder(null)}
                      >
                        Close
                      </button>
                    </>
                  )}

                {/* No actions for other statuses - just close button */}
                {!["PAID", "IN_KITCHEN"].includes(selectedOrder.status) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
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
