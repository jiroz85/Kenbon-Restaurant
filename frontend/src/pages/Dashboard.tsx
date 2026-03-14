import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getStatusBadgeClass } from "../constants/orderStatus";
import "./Dashboard.css";

type Stats = {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: string;
  todayRevenue: string;
  byStatus: Record<string, number>;
};

async function fetchStats(): Promise<Stats> {
  const { data } = await api.get<Stats>("/orders/stats");
  return data;
}

export function Dashboard() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({ queryKey: ["orders", "stats"], queryFn: fetchStats });

  if (isLoading) {
    return (
      <div className="page">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-lead">
          Overview and quick stats for Kenbon Restaurant
        </p>

        <div className="dashboard-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dashboard-card dashboard-card--loading">
              <div className="dashboard-skeleton dashboard-skeleton-label"></div>
              <div className="dashboard-skeleton dashboard-skeleton-value"></div>
            </div>
          ))}
        </div>

        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Orders by Status</h2>
          <div className="dashboard-status-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="dashboard-status-item dashboard-status-item--loading"
              >
                <div className="dashboard-skeleton dashboard-skeleton-status"></div>
                <div className="dashboard-skeleton dashboard-skeleton-count"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    const is403 =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 403;

    const isNetworkError =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "NETWORK_ERROR";

    const getErrorMessage = () => {
      if (is403) {
        return "Welcome! Analytics are available to managers and admins. Use the sidebar to access Orders, Menu, and more.";
      }
      if (isNetworkError) {
        return "Unable to connect to the server. Please check your internet connection and try again.";
      }
      if (error && typeof error === "object" && "message" in error) {
        return `Failed to load stats: ${(error as { message?: string }).message}`;
      }
      return "Failed to load stats. Please try again or contact support.";
    };

    return (
      <div className="page">
        <h1 className="page-title">Dashboard</h1>
        <p
          className="page-lead"
          style={{ color: is403 ? "#94a3b8" : "#f87171" }}
        >
          {getErrorMessage()}
        </p>
        {!is403 && (
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-lead">
        Overview and quick stats for Kenbon Restaurant
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span className="dashboard-card-label">Today&apos;s Orders</span>
          <span className="dashboard-card-value">{stats.todayOrders}</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">Today&apos;s Revenue</span>
          <span className="dashboard-card-value">${stats.todayRevenue}</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">Total Orders</span>
          <span className="dashboard-card-value">{stats.totalOrders}</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">Total Revenue</span>
          <span className="dashboard-card-value">${stats.totalRevenue}</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Orders by Status</h2>
        <ul className="dashboard-status-list">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <li key={status} className="dashboard-status-item">
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span className={getStatusBadgeClass(status)}>{status}</span>
                <span className="dashboard-status-name">{status}</span>
              </div>
              <span className="dashboard-status-count">{count}</span>
            </li>
          ))}
          {Object.keys(stats.byStatus).length === 0 && (
            <li className="dashboard-status-item dashboard-status-item--empty">
              No orders yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
