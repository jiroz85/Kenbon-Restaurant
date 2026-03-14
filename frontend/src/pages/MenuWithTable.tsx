import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TableQRCode } from "../components/TableQRCode";
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
      <div style={{ padding: "1rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            padding: "1rem",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "0.5rem",
          }}
        >
          <h1 style={{ margin: "0 0 0.5rem 0", color: "#f8fafc" }}>
            🍽️ Kenbon Restaurant
          </h1>
          <p style={{ margin: "0", color: "#94a3b8" }}>
            {tableId ? `Table ${tableId} - Browse & Order` : "Browse Menu"}
          </p>
          {tableId && <TableQRCode tableId={tableId} />}
        </div>

        {/* Customer Info */}
        {tableId && (
          <div
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "0.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0", color: "#e2e8f0" }}>
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
                borderRadius: "0.25rem",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "rgba(15, 23, 42, 0.5)",
                color: "#f8fafc",
                fontSize: "1rem",
                marginBottom: "1rem",
              }}
            />
            <textarea
              placeholder="Special requests or dietary restrictions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.25rem",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "rgba(15, 23, 42, 0.5)",
                color: "#f8fafc",
                fontSize: "1rem",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {/* Menu */}
        {categories.map((category) => (
          <div key={category.id} style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                color: "#e2e8f0",
                marginBottom: "1rem",
                borderBottom: "2px solid #3b82f6",
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
                      background: "rgba(30, 41, 59, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      opacity: item.isAvailable ? 1 : 0.6,
                    }}
                  >
                    <div style={{ marginBottom: "1rem" }}>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#f8fafc" }}>
                        {item.name}
                      </h3>
                      {item.description && (
                        <p
                          style={{
                            margin: "0 0 1rem 0",
                            color: "#94a3b8",
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
                          color: "#22c55e",
                        }}
                      >
                        ${item.price}
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
                                color: "#f8fafc",
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
                background: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "0.5rem",
                padding: "1rem",
                minWidth: "300px",
                color: "#e2e8f0",
              }}
            >
              <h3 style={{ margin: "0 0 1rem 0" }}>Your Order</h3>

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
                      borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{menuItem?.name}</span>
                      <span>
                        {item.quantity}x ${menuItem?.price}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "2px solid #3b82f6",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  Total: ${getTotalPrice().toFixed(2)}
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
                  }}
                >
                  🍽️ Place Order
                </button>
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
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
