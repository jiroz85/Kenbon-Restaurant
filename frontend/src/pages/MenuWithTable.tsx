import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TableQRCode } from "../components/TableQRCode";
import { ThemeToggle } from "../components/ThemeToggle";
import "./MenuWithTable.css";

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: string;
  isAvailable: boolean;
  category: { name: string };
};

type Category = {
  id: string;
  name: string;
  description?: string;
};

export function MenuWithTable() {
  const [searchParams] = useSearchParams();
  const [selectedItems, setSelectedItems] = useState<
    { menuItemId: string; quantity: number }[]
  >([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const tableId = searchParams.get("table");

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

  const addItem = (menuItemId: string) => {
    setSelectedItems((prev) => {
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

  const removeItem = (menuItemId: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.menuItemId !== menuItemId),
    );
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
    } else {
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((total, item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      return (
        total + (menuItem ? parseFloat(menuItem.price) * item.quantity : 0)
      );
    }, 0);
  };

  const placeOrder = async () => {
    if (selectedItems.length === 0) return;

    try {
      const orderData = {
        type: "DINE_IN",
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        items: selectedItems.map((item) => ({
          ...item,
          notes: notes,
        })),
      };

      await api.post("/orders", orderData);

      // Show success message
      alert("Order placed successfully! The waiter will be notified.");

      // Reset form
      setSelectedItems([]);
      setCustomerName("");
      setNotes("");
    } catch (error) {
      alert("Failed to place order. Please ask your waiter for assistance.");
    }
  };

  const itemsByCategory = menuItems.reduce(
    (acc, item) => {
      const category = item.category.name;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  return (
    <>
      <ThemeToggle variant="floating" />
      <div style={{ padding: "1.5rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "0.75rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h1 style={{ margin: "0 0 0.5rem 0", color: "var(--text-heading)" }}>
            🍽️ Kenbon Restaurant
          </h1>
          <p style={{ margin: "0", color: "var(--text-muted)" }}>
            {tableId ? `Table ${tableId} - Browse & Order` : "Browse Menu"}
          </p>
          {tableId && <TableQRCode tableId={tableId} />}
        </div>

        {/* Customer Info */}
        {tableId && (
          <div
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "0.75rem",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-heading)" }}>
              Your Information
            </h3>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card-muted)",
                color: "var(--text-primary)",
                fontSize: "1rem",
                marginBottom: "1rem",
                boxSizing: "border-box",
              }}
            />
            <textarea
              placeholder="Special requests or dietary restrictions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card-muted)",
                color: "var(--text-primary)",
                fontSize: "1rem",
                minHeight: "80px",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Menu */}
        {categories.map((category) => (
          <div key={category.id} style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                color: "var(--text-heading)",
                marginBottom: "1rem",
                borderBottom: "2px solid var(--primary-color)",
                paddingBottom: "0.5rem",
              }}
            >
              {category.name}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              {itemsByCategory[category.name] &&
                itemsByCategory[category.name].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "0.75rem",
                      padding: "1.25rem",
                      boxShadow: "var(--shadow-card)",
                      opacity: item.isAvailable ? 1 : 0.6,
                    }}
                  >
                    <div style={{ marginBottom: "1rem" }}>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-heading)" }}>
                        {item.name}
                      </h3>
                      {item.description && (
                        <p
                          style={{
                            margin: "0 0 1rem 0",
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      <div
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color: "var(--price-color)",
                        }}
                      >
                        ETB {item.price}
                      </div>
                    </div>

                    {item.isAvailable && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {selectedItems.find(
                          (si) => si.menuItemId === item.id,
                        ) ? (
                          <>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  selectedItems.find(
                                    (si) => si.menuItemId === item.id,
                                  )?.quantity! - 1,
                                )
                              }
                              style={{
                                padding: "0.5rem",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "0.25rem",
                                cursor: "pointer",
                              }}
                            >
                              -
                            </button>
                            <span
                              style={{
                                minWidth: "2rem",
                                textAlign: "center",
                                color: "var(--text-heading)",
                                fontWeight: "600",
                              }}
                            >
                              {selectedItems.find(
                                (si) => si.menuItemId === item.id,
                              )?.quantity || 0}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  selectedItems.find(
                                    (si) => si.menuItemId === item.id,
                                  )?.quantity! + 1,
                                )
                              }
                              style={{
                                padding: "0.5rem",
                                background: "#22c55e",
                                color: "white",
                                border: "none",
                                borderRadius: "0.25rem",
                                cursor: "pointer",
                              }}
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addItem(item.id)}
                            style={{
                              padding: "0.75rem 1.5rem",
                              background: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              fontSize: "1rem",
                            }}
                          >
                            Add to Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        <>
          {/* Order Summary & Checkout */}
          {selectedItems.length > 0 && (
            <div
              style={{
                position: "sticky",
                bottom: "20px",
                left: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                minWidth: "300px",
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-heading)" }}>Your Order</h3>

              {selectedItems.map((item) => {
                const menuItem = menuItems.find(
                  (mi) => mi.id === item.menuItemId,
                );
                return (
                  <div
                    key={item.menuItemId}
                    style={{
                      marginBottom: "0.5rem",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "var(--text-heading)" }}>{menuItem?.name}</span>
                      <span style={{ color: "var(--price-color)", fontWeight: "600" }}>
                        {item.quantity}x ETB {menuItem?.price}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "2px solid var(--primary-color)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    color: "var(--text-heading)",
                  }}
                >
                  Total: ETB {getTotalPrice().toFixed(2)}
                </div>
                <button
                  onClick={placeOrder}
                  style={{
                    padding: "1rem 2rem",
                    background: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "600",
                  }}
                >
                  🍽️ Place Order
                </button>
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  Your waiter will receive this order immediately
                </p>
              </div>
            </div>
          )}

          {/* Call Waiter Button */}
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "#ef4444",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            📞 Call Waiter
          </div>
        </>
      </div>
    </>
  );
}
