import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import "./Settings.css";

type Settings = {
  taxRate: string;
  serviceChargeRate: string;
  currency: string;
  locale: string;
  openingHours?: Record<string, { open: string; close: string } | null> | null;
  holidays?: string[] | null;
};

async function fetchSettings(): Promise<Settings> {
  const { data } = await api.get<Settings>("/settings");
  return data;
}
async function updateSettings(payload: Partial<Settings>) {
  const { data } = await api.patch<Settings>("/settings", payload);
  return data;
}

const canEdit = (roles: string[] | undefined) =>
  roles?.some((r) => r === "ADMIN" || r === "MANAGER") ?? false;

export function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });
  const [form, setForm] = useState<Partial<Settings>>({});

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const effective = { ...settings, ...form };

  const handleSave = () => {
    mutation.mutate({
      taxRate: effective.taxRate,
      serviceChargeRate: effective.serviceChargeRate,
      currency: effective.currency,
      locale: effective.locale,
    });
  };

  if (!settings)
    return (
      <div className="page">
        <p className="page-lead">Loading settings…</p>
      </div>
    );

  return (
    <div className="page">
      <h1 className="page-title">Restaurant Settings</h1>
      <p className="page-lead">Taxes, currency, and general configuration</p>

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <h2 style={{ color: "var(--text-heading)", marginTop: 0 }}>Billing</h2>
        <div style={{ display: "grid", gap: "1rem", maxWidth: "400px" }}>
          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <input
              type="text"
              className="form-input"
              value={effective.taxRate ?? "0"}
              onChange={(e) =>
                setForm((p) => ({ ...p, taxRate: e.target.value }))
              }
              disabled={!canEdit(user?.roles)}
              placeholder="e.g. 10"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Service Charge (%)</label>
            <input
              type="text"
              className="form-input"
              value={effective.serviceChargeRate ?? "0"}
              onChange={(e) =>
                setForm((p) => ({ ...p, serviceChargeRate: e.target.value }))
              }
              disabled={!canEdit(user?.roles)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select
              className="form-select"
              value={effective.currency ?? "ETB"}
              onChange={(e) =>
                setForm((p) => ({ ...p, currency: e.target.value }))
              }
              disabled={!canEdit(user?.roles)}
            >
              <option value="ETB">ETB – Ethiopian Birr</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
              <option value="GBP">GBP – British Pound</option>
              <option value="NGN">NGN – Nigerian Naira</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Locale</label>
            <select
              className="form-select"
              value={effective.locale ?? "en"}
              onChange={(e) =>
                setForm((p) => ({ ...p, locale: e.target.value }))
              }
              disabled={!canEdit(user?.roles)}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </div>
          {canEdit(user?.roles) && (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      <p
        className="page-lead"
        style={{ marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}
      >
        Tax and service charge will be applied to order totals. Currency is used
        for display.
      </p>
    </div>
  );
}
