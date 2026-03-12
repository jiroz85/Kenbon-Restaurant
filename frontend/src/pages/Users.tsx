import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

type User = {
  id: string;
  email: string;
  username: string;
  roles: string[];
  createdAt: string;
};

const ROLES = [
  "ADMIN",
  "MANAGER",
  "WAITER",
  "KITCHEN",
  "CASHIER",
  "DELIVERY",
  "CUSTOMER",
] as const;

async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}
async function createUser(payload: {
  email: string;
  username: string;
  password: string;
  roles?: string[];
}) {
  const { data } = await api.post<User>("/users", payload);
  return data;
}
async function updateUser(
  id: string,
  payload: Partial<{
    email: string;
    username: string;
    password: string;
    roles: string[];
  }>,
) {
  const { data } = await api.patch<User>(`/users/${id}`, payload);
  return data;
}
async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

const isAdmin = (roles: string[] | undefined) =>
  roles?.includes("ADMIN") ?? false;

export function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    roles: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreate(false);
      setForm({ email: "", username: "", password: "", roles: [] });
      setError(null);
    },
    onError: (err: {
      response?: { data?: { message?: string | string[] } };
    }) => {
      setError(
        Array.isArray(err.response?.data?.message)
          ? err.response.data.message[0]
          : err.response?.data?.message || "Failed",
      );
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateUser>[1];
    }) => updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingId(null);
      setError(null);
    },
    onError: (err: {
      response?: { data?: { message?: string | string[] } };
    }) => {
      setError(
        Array.isArray(err.response?.data?.message)
          ? err.response.data.message[0]
          : err.response?.data?.message || "Failed",
      );
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const handleCreate = () => {
    setError(null);
    if (!form.email || !form.username || !form.password) {
      setError("Email, username and password are required");
      return;
    }
    createMutation.mutate({
      email: form.email,
      username: form.username,
      password: form.password,
      roles: form.roles.length ? form.roles : undefined,
    });
  };

  const toggleRole = (role: string) => {
    setForm((p) => ({
      ...p,
      roles: p.roles.includes(role)
        ? p.roles.filter((r) => r !== role)
        : [...p.roles, role],
    }));
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setForm({
      email: u.email,
      username: u.username,
      password: "",
      roles: u.roles,
    });
    setError(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const payload: Parameters<typeof updateUser>[1] = {
      email: form.email,
      username: form.username,
      roles: form.roles,
    };
    if (form.password) payload.password = form.password;
    updateMutation.mutate({ id: editingId, payload });
  };

  const canManage = isAdmin(currentUser?.roles);

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
          <h1 className="page-title">Users</h1>
          <p className="page-lead">Manage staff accounts and roles</p>
        </div>
        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowCreate(true);
              setError(null);
              setForm({ email: "", username: "", password: "", roles: [] });
            }}
          >
            + Add User
          </button>
        )}
      </div>

      {showCreate && canManage && (
        <div
          className="card"
          style={{
            marginTop: "1.5rem",
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <h2 style={{ color: "#e2e8f0", marginTop: 0 }}>Create User</h2>
          <div style={{ display: "grid", gap: "1rem", maxWidth: "400px" }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="user@kenbon.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                placeholder="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password (min 6)</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Roles</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {ROLES.map((r) => (
                  <label
                    key={r}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      color: "#e2e8f0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.roles.includes(r)}
                      onChange={() => toggleRole(r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                Create
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Roles</th>
              <th>Created</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                {editingId === u.id ? (
                  <>
                    <td>
                      <input
                        type="email"
                        className="form-input"
                        style={{ width: "100%" }}
                        value={form.email}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: "100%" }}
                        value={form.username}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, username: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.35rem",
                        }}
                      >
                        {ROLES.map((r) => (
                          <label
                            key={r}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              color: "#e2e8f0",
                              fontSize: "0.85rem",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={form.roles.includes(r)}
                              onChange={() => toggleRole(r)}
                            />
                            {r}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td colSpan={canManage ? 2 : 1}>
                      <input
                        type="password"
                        className="form-input"
                        style={{ width: "140px", marginRight: "0.5rem" }}
                        value={form.password}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, password: e.target.value }))
                        }
                        placeholder="New password (optional)"
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={saveEdit}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginLeft: "0.5rem" }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{u.email}</td>
                    <td>{u.username}</td>
                    <td>{u.roles.join(", ") || "–"}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    {canManage && (
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => startEdit(u)}
                        >
                          Edit
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ marginLeft: "0.5rem" }}
                            onClick={() => deleteMutation.mutate(u.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !showCreate && (
        <p
          className="page-lead"
          style={{ marginTop: "1rem", color: "#94a3b8" }}
        >
          No users yet. Add one above.
        </p>
      )}
    </div>
  );
}
