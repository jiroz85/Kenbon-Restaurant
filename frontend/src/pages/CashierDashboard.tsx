import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import "../styles/CashierDashboard.css";

type Order = {
  id: string;
  type: string;
  status: string;
  grandTotal: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
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
  createdBy?: {
    id: string;
    username?: string;
  };
  table?: {
    label: string;
  };
};

export function CashierDashboard() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders that need payment (PENDING_PAYMENT)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "pending-payment"],
    queryFn: async () => {
      const { data } = await api.get<Order[]>("/orders/status/PENDING_PAYMENT");
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
      queryClient.invalidateQueries({ queryKey: ["orders", "pending-payment"] });
      setSelectedOrder(null);
    },
  });

  // WebSocket listener for new orders
  useEffect(() => {
    const socket = getSocket();

    socket.on("order.created", (order: Order) => {
      // Refresh the list when new orders are created
      queryClient.invalidateQueries({ queryKey: ["orders", "pending-payment"] });
    });

    return () => {
      socket.off("order.created");
    };
  }, [queryClient]);

  const handlePayment = (orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: "PAID" });
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  if (isLoading) {
    return (
      <div className="page">
        <h1 className="page-title">Cashier Dashboard</h1>
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Cashier Dashboard</h1>
      <p className="page-lead">Process payments for customer orders</p>

      {/* Pending Orders Alert */}
      {orders.length > 0 && (
        <div className="payment-alert">
          <h3>💰 Orders Awaiting Payment</h3>
          <p>You have {orders.length} order{orders.length > 1 ? "s" : ""} waiting for payment processing.</p>
        </div>
      )}

      <div className="cashier-dashboard-grid">
        {/* Orders List */}
        <div className="orders-section">
          <h2>Orders Pending Payment</h2>
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? "selected" : ""}`}
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-info">
                  <span className="order-id">#{order.id.slice(0, 8)}</span>
                  <span className="order-customer">
                    {order.customerName || order.createdBy?.username || "Guest"}
                  </span>
                  {order.table && (
                    <span className="order-table">Table {order.table.label}</span>
                  )}
                </div>
                <div className="order-details">
                  <span className="order-type">{order.type}</span>
                  <span className="order-total">${order.grandTotal}</span>
                  <span className="order-time">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="no-orders">
              <div className="placeholder-icon">💳</div>
              <p>No orders awaiting payment</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="order-details-section">
          {selectedOrder ? (
            <div className="order-details-card">
              <div className="order-header">
                <h3>Order #{selectedOrder.id.slice(0, 8)}</h3>
                <span className="order-type-badge">{selectedOrder.type}</span>
              </div>

              <div className="customer-info">
                <h4>Customer Information</h4>
                <p>
                  <strong>Name:</strong> {selectedOrder.customerName || selectedOrder.createdBy?.username || "Guest"}
                </p>
                {selectedOrder.table && (
                  <p>
                    <strong>Table:</strong> {selectedOrder.table.label}
                  </p>
                )}
                {selectedOrder.customerPhone && (
                  <p>
                    <strong>Phone:</strong> {selectedOrder.customerPhone}
                  </p>
                )}
                {selectedOrder.deliveryAddress && (
                  <p>
                    <strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}
                  </p>
                )}
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
                <h3>Total: ${selectedOrder.grandTotal}</h3>
              </div>

              <div className="payment-actions">
                <button
                  className="btn btn-success btn-large"
                  onClick={() => handlePayment(selectedOrder.id)}
                  disabled={updateOrderStatus.isPending}
                >
                  {updateOrderStatus.isPending ? "Processing..." : "💰 Mark as Paid"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="no-order-selected">
              <div className="placeholder-icon">📋</div>
              <p>Select an order to process payment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
