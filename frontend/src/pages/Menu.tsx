import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import "./Menu.css";

type Category = { id: string; name: string; description?: string };
type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  isAvailable: boolean;
  category: Category;
};

async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/menu/categories");
  return data;
}
async function fetchItems(): Promise<MenuItem[]> {
  const { data } = await api.get<MenuItem[]>("/menu/items");
  return data;
}
async function createCategory(payload: { name: string; description?: string }) {
  const { data } = await api.post<Category>("/menu/categories", payload);
  return data;
}
async function createItem(payload: {
  name: string;
  description?: string;
  price: string;
  categoryId: string;
  isAvailable?: boolean;
}) {
  const { data } = await api.post<MenuItem>("/menu/items", payload);
  return data;
}
async function updateItem(
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    price: string;
    isAvailable: boolean;
  }>,
) {
  const { data } = await api.patch<MenuItem>(`/menu/items/${id}`, payload);
  return data;
}
async function deleteItem(id: string) {
  await api.delete(`/menu/items/${id}`);
}
async function deleteCategory(id: string) {
  await api.delete(`/menu/categories/${id}`);
}

const canEdit = (roles: string[] | undefined) =>
  roles?.some((r) => r === "ADMIN" || r === "MANAGER") ?? false;

export function Menu() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newCatName, setNewCatName] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    categoryId: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    isAvailable: true,
  });

  const { data: categories } = useQuery({
    queryKey: ["menu", "categories"],
    queryFn: fetchCategories,
  });
  const { data: items } = useQuery({
    queryKey: ["menu", "items"],
    queryFn: fetchItems,
  });

  const createCatMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["menu", "categories"] }),
  });
  const createItemMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "items"] });
      setNewItem({ name: "", price: "", categoryId: "", description: "" });
    },
  });
  const updateItemMutation = useMutation({
    mutationFn: ({
      id,
      ...p
    }: { id: string } & Parameters<typeof updateItem>[1]) => updateItem(id, p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "items"] });
      setEditingId(null);
    },
  });
  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["menu", "items"] }),
  });
  const deleteCatMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["menu", "categories"] }),
  });

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    createCatMutation.mutate({ name: newCatName.trim() });
    setNewCatName("");
  };
  const handleAddItem = () => {
    if (!newItem.name.trim() || !newItem.price || !newItem.categoryId) return;
    createItemMutation.mutate({
      name: newItem.name.trim(),
      price: newItem.price,
      categoryId: newItem.categoryId,
      description: newItem.description || undefined,
      isAvailable: true,
    });
  };
  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      price: item.price,
      isAvailable: item.isAvailable,
    });
  };
  const saveEdit = () => {
    if (!editingId) return;
    updateItemMutation.mutate({ id: editingId, ...editForm });
  };

  const itemsByCategory = (catId: string) =>
    items?.filter((i) => i.category.id === catId) ?? [];

  return (
    <div className="page">
      <h1 className="page-title">Menu</h1>
      <p className="page-lead">Menu catalog and management</p>

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
            Add Category
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              style={{ maxWidth: "250px" }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAddCategory}
              disabled={createCatMutation.isPending}
            >
              Add Category
            </button>
          </div>

          <h2
            style={{
              color: "#e2e8f0",
              marginTop: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            Add Item
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "flex-end",
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, name: e.target.value }))
                }
                style={{ minWidth: "150px" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Price</label>
              <input
                type="text"
                className="form-input"
                placeholder="9.99"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, price: e.target.value }))
                }
                style={{ width: "100px" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newItem.categoryId}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, categoryId: e.target.value }))
                }
                style={{ minWidth: "140px" }}
              >
                <option value="">Select</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAddItem}
              disabled={createItemMutation.isPending}
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        {categories?.map((cat) => (
          <div key={cat.id} style={{ marginBottom: "2rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h2 className="dashboard-section-title" style={{ margin: 0 }}>
                {cat.name}
              </h2>
              {canEdit(user?.roles) && itemsByCategory(cat.id).length === 0 && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteCatMutation.mutate(cat.id)}
                >
                  Delete
                </button>
              )}
            </div>
            <ul
              className="menu-list"
              style={{
                background: "rgba(30, 41, 59, 0.4)",
                borderRadius: "0.75rem",
                padding: "1rem",
              }}
            >
              {itemsByCategory(cat.id).map((item) => (
                <li
                  key={item.id}
                  className="menu-item"
                  style={{ borderColor: "rgba(148, 163, 184, 0.2)" }}
                >
                  {editingId === item.id ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, name: e.target.value }))
                        }
                        style={{ flex: 1, minWidth: "120px" }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, price: e.target.value }))
                        }
                        style={{ width: "80px" }}
                      />
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          color: "#e2e8f0",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editForm.isAvailable}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              isAvailable: e.target.checked,
                            }))
                          }
                        />
                        Available
                      </label>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={saveEdit}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="menu-item-header">
                      <div>
                        <span
                          className="menu-item-name"
                          style={{ color: "#f8fafc" }}
                        >
                          {item.name}
                        </span>
                        {!item.isAvailable && (
                          <span
                            className="badge badge-cancelled"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            Unavailable
                          </span>
                        )}
                        {item.description && (
                          <p
                            className="menu-item-description"
                            style={{ margin: "0.25rem 0 0" }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <span
                          className="menu-item-price"
                          style={{ color: "#86efac" }}
                        >
                          ${item.price}
                        </span>
                        {canEdit(user?.roles) && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {itemsByCategory(cat.id).length === 0 && (
                <li style={{ color: "#94a3b8", padding: "0.75rem" }}>
                  No items in this category
                </li>
              )}
            </ul>
          </div>
        ))}
        {(!categories || categories.length === 0) && (
          <p className="page-lead" style={{ color: "#94a3b8" }}>
            No categories yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}
