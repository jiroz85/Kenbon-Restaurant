import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  quantity: string;
  alertLevel: string;
  isActive: boolean;
};

async function fetchIngredients(): Promise<Ingredient[]> {
  const { data } = await api.get<Ingredient[]>("/inventory/ingredients");
  return data;
}
async function fetchLowStock(): Promise<Ingredient[]> {
  const { data } = await api.get<Ingredient[]>("/inventory/low-stock");
  return data;
}
async function createIngredient(payload: {
  name: string;
  unit: string;
  quantity: string;
  alertLevel: string;
}) {
  const { data } = await api.post<Ingredient>(
    "/inventory/ingredients",
    payload,
  );
  return data;
}
async function recordMovement(payload: {
  ingredientId: string;
  type: "INCREASE" | "DECREASE";
  quantity: string;
  reason?: string;
}) {
  const { data } = await api.post("/inventory/stock-movements", payload);
  return data;
}

const canEdit = (roles: string[] | undefined) =>
  roles?.some((r) => r === "ADMIN" || r === "MANAGER" || r === "KITCHEN") ??
  false;

export function Inventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newIng, setNewIng] = useState({
    name: "",
    unit: "kg",
    quantity: "0",
    alertLevel: "1",
  });
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"INCREASE" | "DECREASE">(
    "INCREASE",
  );

  const { data: ingredients = [] } = useQuery({
    queryKey: ["inventory", "ingredients"],
    queryFn: fetchIngredients,
  });
  const { data: lowStock = [] } = useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: fetchLowStock,
  });

  const createMutation = useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setNewIng({ name: "", unit: "kg", quantity: "0", alertLevel: "1" });
    },
  });
  const movementMutation = useMutation({
    mutationFn: recordMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setAdjustId(null);
      setAdjustQty("");
    },
  });

  const handleAdd = () => {
    if (!newIng.name.trim()) return;
    createMutation.mutate({
      name: newIng.name.trim(),
      unit: newIng.unit,
      quantity: newIng.quantity,
      alertLevel: newIng.alertLevel,
    });
  };
  const handleAdjust = () => {
    if (!adjustId || !adjustQty || parseFloat(adjustQty) <= 0) return;
    movementMutation.mutate({
      ingredientId: adjustId,
      type: adjustType,
      quantity: adjustQty,
      reason: "Manual adjustment",
    });
  };

  const isLow = (ing: Ingredient) =>
    Number(ing.quantity) <= Number(ing.alertLevel) && ing.isActive;

  return (
    <div className="page">
      <h1 className="page-title">Inventory</h1>
      <p className="page-lead">Ingredients and stock levels</p>

      {lowStock.length > 0 && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "0.75rem",
            color: "#fca5a5",
            marginTop: "1rem",
          }}
        >
          <strong>Low stock alert:</strong>{" "}
          {lowStock.map((i) => i.name).join(", ")}
        </div>
      )}

      {canEdit(user?.roles) && (
        <div
          className="card"
          style={{
            marginTop: "1.5rem",
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <h2 style={{ color: "#e2e8f0", marginTop: 0, marginBottom: "1rem" }}>
            Add Ingredient
          </h2>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Chicken"
                value={newIng.name}
                onChange={(e) =>
                  setNewIng((p) => ({ ...p, name: e.target.value }))
                }
                style={{ minWidth: "140px" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unit</label>
              <select
                className="form-select"
                value={newIng.unit}
                onChange={(e) =>
                  setNewIng((p) => ({ ...p, unit: e.target.value }))
                }
                style={{ width: "100px" }}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quantity</label>
              <input
                type="text"
                className="form-input"
                placeholder="10"
                value={newIng.quantity}
                onChange={(e) =>
                  setNewIng((p) => ({ ...p, quantity: e.target.value }))
                }
                style={{ width: "80px" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Alert at</label>
              <input
                type="text"
                className="form-input"
                placeholder="2"
                value={newIng.alertLevel}
                onChange={(e) =>
                  setNewIng((p) => ({ ...p, alertLevel: e.target.value }))
                }
                style={{ width: "80px" }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={createMutation.isPending}
            >
              Add
            </button>
          </div>

          {adjustId && (
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <h3 style={{ color: "#e2e8f0", marginTop: 0 }}>Adjust stock</h3>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <select
                  className="form-select"
                  value={adjustType}
                  onChange={(e) =>
                    setAdjustType(e.target.value as "INCREASE" | "DECREASE")
                  }
                  style={{ width: "120px" }}
                >
                  <option value="INCREASE">Increase</option>
                  <option value="DECREASE">Decrease</option>
                </select>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Quantity"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  style={{ width: "100px" }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAdjust}
                  disabled={movementMutation.isPending}
                >
                  Apply
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setAdjustId(null);
                    setAdjustQty("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Alert Level</th>
              <th>Status</th>
              {canEdit(user?.roles) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => (
              <tr
                key={ing.id}
                style={
                  isLow(ing)
                    ? { background: "rgba(239, 68, 68, 0.1)" }
                    : undefined
                }
              >
                <td style={{ fontWeight: 500 }}>{ing.name}</td>
                <td>{ing.quantity}</td>
                <td>{ing.unit}</td>
                <td>{ing.alertLevel}</td>
                <td>
                  {isLow(ing) ? (
                    <span className="badge badge-cancelled">Low</span>
                  ) : (
                    <span className="badge badge-ready">OK</span>
                  )}
                </td>
                {canEdit(user?.roles) && (
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setAdjustId(ing.id);
                        setAdjustQty("");
                      }}
                    >
                      Adjust
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {ingredients.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    color: "#94a3b8",
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
                  No ingredients. Run seed or add above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
