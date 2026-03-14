import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import "../styles/CustomerDashboard.css";

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: string;
  isAvailable: boolean;
  category: { name: string };
  image?: string;
  variants?: { id: string; name: string; price: string }[];
  addons?: { id: string; name: string; price: string }[];
};

type Category = {
  id: string;
  name: string;
  description?: string;
};

type CartItem = {
  menuItemId: string;
  quantity: number;
  variants?: { id: string; name: string; price: string }[];
  addons?: { id: string; name: string; price: string }[];
  notes?: string;
};

type CustomerOrder = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  createdBy?: {
    id: string;
    username?: string;
  };
};

export function CustomerDashboard() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [orderType, setOrderType] = useState<
    "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  >("TAKEAWAY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [notifications, setNotifications] = useState<
    { message: string; className?: string }[]
  >([]);

  useEffect(() => {
    const socket = getSocket();

    console.log("Customer Dashboard: Connecting to WebSocket...");

    // Test connection
    socket.on("connect", () => {
      console.log("Customer Dashboard: WebSocket connected");
      // Test emit to verify connection works
      socket.emit("test", { message: "Customer dashboard connected" });
    });

    // Listen for test events
    socket.on("test", (data) => {
      console.log("Customer Dashboard: Received test event:", data);
    });

    // Listen for order status updates
    socket.on("order.statusUpdated", (order: CustomerOrder) => {
      console.log("Customer Dashboard: Received order status update:", order);
      console.log("Customer Dashboard: Current user ID:", user?.id);
      console.log("Customer Dashboard: Order createdBy:", order.createdBy?.id);

      // Check if this order belongs to current user
      if (user?.id && order.createdBy?.id === user.id) {
        let message = "";

        // Create specific messages for different statuses
        switch (order.status) {
          case "IN_KITCHEN":
            message = `🍳 Order #${order.id} is now being prepared!`;
            break;
          case "READY":
            message = `✅ Order #${order.id} is ready for pickup!`;
            break;
          case "OUT_FOR_DELIVERY":
            message = `🚚 Order #${order.id} is now out for delivery to your home!`;
            break;
          case "SERVED":
            message = `🎉 Order #${order.id} has been delivered!`;
            break;
          case "PAID":
            message = `🎊 Order #${order.id} has been successfully delivered! Thank you for your order!`;
            break;
          case "CANCELLED":
            message = `❌ Order #${order.id} has been cancelled`;
            break;
          default:
            message = `Order #${order.id} is now ${order.status.replace("_", " ").toLowerCase()}!`;
        }

        console.log("Customer Dashboard: Showing notification:", message);

        // Add CSS class based on notification type
        let notificationClass = "";
        console.log("Customer Dashboard: Order status:", order.status);

        if (order.status === "OUT_FOR_DELIVERY") {
          notificationClass = "notification-delivery";
          console.log(
            "Customer Dashboard: Setting delivery notification class",
          );
        } else if (order.status === "IN_KITCHEN") {
          notificationClass = "notification-kitchen";
          console.log("Customer Dashboard: Setting kitchen notification class");
        } else if (order.status === "READY") {
          notificationClass = "notification-ready";
          console.log("Customer Dashboard: Setting ready notification class");
        } else if (order.status === "PAID") {
          notificationClass = "notification-delivered";
          console.log(
            "Customer Dashboard: Setting delivered notification class",
          );
        } else if (order.status === "CANCELLED") {
          notificationClass = "notification-cancelled";
          console.log(
            "Customer Dashboard: Setting cancelled notification class",
          );
        } else {
          console.log("Customer Dashboard: Using default notification class");
        }

        setNotifications((prev) => {
          const next = [...prev, { message, className: notificationClass }];

          // Remove notification after 8 seconds for delivery notifications
          const notificationDuration =
            order.status === "OUT_FOR_DELIVERY" ? 8000 : 5000;

          setTimeout(() => {
            setNotifications((current) =>
              current.filter((n) => n.message !== message),
            );
          }, notificationDuration);

          return next;
        });
      } else {
        console.log(
          "Customer Dashboard: Order does not belong to current user, skipping notification",
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("Customer Dashboard: WebSocket disconnected");
    });

    return () => {
      socket.off("order.statusUpdated");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("test");
    };
  }, [user?.id]);

  const { data: categories = [] } = useQuery({
    queryKey: ["menu", "categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/menu/categories");
      return data;
    },
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu", "items"],
    queryFn: async () => {
      const { data } = await api.get<MenuItem[]>("/menu/items");
      return data;
    },
  });

  const { data: customerOrders = [] } = useQuery({
    queryKey: ["orders", "customer", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await api.get<CustomerOrder[]>(
        `/orders/customer/${user.id}`,
      );
      return data;
    },
    enabled: !!user?.id,
  });

  const itemsByCategory = menuItems.reduce(
    (acc, item) => {
      const category = item.category.name;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : itemsByCategory[selectedCategory] || [];

  const addToCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItemId);
      if (existing) {
        return prev.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { menuItemId, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity === 0) {
      setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) return total;

      let itemPrice = parseFloat(menuItem.price);

      // Add variant prices
      if (item.variants) {
        itemPrice += item.variants.reduce(
          (sum, variant) => sum + parseFloat(variant.price),
          0,
        );
      }

      // Add addon prices
      if (item.addons) {
        itemPrice += item.addons.reduce(
          (sum, addon) => sum + parseFloat(addon.price),
          0,
        );
      }

      return total + itemPrice * item.quantity;
    }, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    // Validation for delivery orders
    if (orderType === "DELIVERY") {
      if (!deliveryAddress.trim()) {
        alert("Please enter your delivery address");
        return;
      }
      if (!customerPhone.trim()) {
        alert("Please enter your phone number for delivery");
        return;
      }
    }

    try {
      const orderData: any = {
        type: orderType,
        customerName: user?.username,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: notes,
        })),
      };

      // Add delivery-specific fields
      if (orderType === "DELIVERY") {
        orderData.deliveryAddress = deliveryAddress;
        orderData.customerPhone = customerPhone;
      }

      console.log("Sending order data:", orderData);
      const response = await api.post("/orders", orderData);
      console.log("Order response:", response);

      // Show success message
      alert(
        "Order placed successfully! The restaurant will prepare your order.",
      );

      // Clear cart
      setCart([]);
      setNotes("");
    } catch (error) {
      console.error("Order placement error:", error);
      alert(
        `Failed to place order: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Customer Dashboard</h1>
      <p className="page-lead">
        Welcome, {user?.username}! Browse our menu and place your order.
      </p>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`notification-item ${notification.className || ""}`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Customer's Recent Orders */}
      {customerOrders.length > 0 && (
        <div className="dashboard-section" style={{ marginBottom: "2rem" }}>
          <h2 className="dashboard-section-title">Your Recent Orders</h2>
          <div className="order-grid">
            {customerOrders.slice(0, 3).map((order: CustomerOrder) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">#{order.id}</span>
                  <span
                    className={`order-status ${getStatusBadgeClass(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <p className="order-total">${order.total}</p>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="category-filter" style={{ marginBottom: "2rem" }}>
        <button
          className={`category-btn ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          All Items
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.name ? "active" : ""}`}
            onClick={() => setSelectedCategory(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="menu-grid">
        {filteredItems
          .filter((item) => item.isAvailable)
          .map((item) => (
            <div key={item.id} className="menu-item-card">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="menu-item-image"
                />
              )}
              <div className="menu-item-content">
                <h3 className="menu-item-name">{item.name}</h3>
                {item.description && (
                  <p className="menu-item-description">{item.description}</p>
                )}
                <div className="menu-item-price">${item.price}</div>

                {/* Variants */}
                {item.variants && item.variants.length > 0 && (
                  <div className="menu-item-variants">
                    <p className="variants-label">Options:</p>
                    {item.variants.map((variant) => (
                      <label key={variant.id} className="variant-option">
                        <input type="radio" name={`variant-${item.id}`} />
                        <span>
                          {variant.name} +${variant.price}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Addons */}
                {item.addons && item.addons.length > 0 && (
                  <div className="menu-item-addons">
                    <p className="addons-label">Add-ons:</p>
                    {item.addons.map((addon) => (
                      <label key={addon.id} className="addon-option">
                        <input type="checkbox" />
                        <span>
                          {addon.name} +${addon.price}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => addToCart(item.id)}
                  className="btn btn-primary"
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Shopping Cart */}
      {cart.length > 0 && (
        <div className="cart-sidebar">
          <h3>Your Cart</h3>
          {cart.map((item) => {
            const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
            return (
              <div key={item.menuItemId} className="cart-item">
                <div className="cart-item-info">
                  <span>{menuItem?.name}</span>
                  <span>${menuItem?.price}</span>
                </div>
                <div className="cart-item-controls">
                  <button
                    onClick={() =>
                      updateQuantity(item.menuItemId, item.quantity - 1)
                    }
                    className="btn btn-sm"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.menuItemId, item.quantity + 1)
                    }
                    className="btn btn-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}

          {/* Order Type Selection */}
          <div className="order-type-selection">
            <h4>Order Type:</h4>
            <div className="order-type-buttons">
              <button
                onClick={() => setOrderType("TAKEAWAY")}
                className={`btn ${orderType === "TAKEAWAY" ? "btn-primary" : "btn-secondary"}`}
              >
                🥡 Takeaway
              </button>
              <button
                onClick={() => setOrderType("DELIVERY")}
                className={`btn ${orderType === "DELIVERY" ? "btn-primary" : "btn-secondary"}`}
              >
                🚚 Delivery
              </button>
              <button
                onClick={() => setOrderType("DINE_IN")}
                className={`btn ${orderType === "DINE_IN" ? "btn-primary" : "btn-secondary"}`}
              >
                🍽️ Dine In
              </button>
            </div>
          </div>

          {/* Delivery Information */}
          {orderType === "DELIVERY" && (
            <div className="delivery-info">
              <h4>Delivery Information:</h4>
              <div className="form-group">
                <label>Delivery Address:</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Your phone number..."
                />
              </div>
            </div>
          )}

          <div className="cart-notes">
            <label>Special Instructions:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests..."
              rows={3}
            />
          </div>

          <div className="cart-total">
            <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
          </div>

          <button
            onClick={placeOrder}
            className="btn btn-success"
            style={{ width: "100%" }}
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  const baseClass = "status-badge";
  switch (status.toUpperCase()) {
    case "PENDING":
      return `${baseClass} status-pending`;
    case "CONFIRMED":
      return `${baseClass} status-confirmed`;
    case "PREPARING":
      return `${baseClass} status-preparing`;
    case "READY":
      return `${baseClass} status-ready`;
    case "DELIVERED":
      return `${baseClass} status-delivered`;
    case "OUT_FOR_DELIVERY":
      return `${baseClass} status-out-for-delivery`;
    case "CANCELLED":
      return `${baseClass} status-cancelled`;
    default:
      return baseClass;
  }
}
