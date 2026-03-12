import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./MainLayout.css";

const NAV_ITEMS: { to: string; label: string; roles: string[] }[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    roles: [
      "ADMIN",
      "MANAGER",
      "WAITER",
      "KITCHEN",
      "CASHIER",
      "DELIVERY",
      "CUSTOMER",
    ],
  },
  {
    to: "/orders",
    label: "Orders",
    roles: ["ADMIN", "MANAGER", "WAITER", "KITCHEN", "CASHIER"],
  },
  {
    to: "/menu",
    label: "Menu",
    roles: ["ADMIN", "MANAGER", "WAITER", "KITCHEN", "CASHIER", "CUSTOMER"],
  },
  { to: "/kitchen", label: "Kitchen", roles: ["ADMIN", "MANAGER", "KITCHEN"] },
  {
    to: "/delivery",
    label: "Delivery",
    roles: ["ADMIN", "MANAGER", "DELIVERY"],
  },
  {
    to: "/inventory",
    label: "Inventory",
    roles: ["ADMIN", "MANAGER", "KITCHEN"],
  },
  { to: "/users", label: "Users", roles: ["ADMIN", "MANAGER"] },
  { to: "/settings", label: "Settings", roles: ["ADMIN", "MANAGER"] },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const userRoles = user?.roles ?? [];
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => userRoles.includes(r)),
  );
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="main-layout">
      <aside className="main-layout-sidebar">
        <div className="main-layout-brand">
          <span className="main-layout-brand-text">Kenbon</span>
        </div>
        <nav className="main-layout-nav">
          {visibleNavItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `main-layout-nav-link ${isActive ? "main-layout-nav-link--active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="main-layout-user">
          <span className="main-layout-user-name" title={user?.email ?? ""}>
            {user?.username ?? "User"}
          </span>
          {user?.roles?.length ? (
            <span className="main-layout-user-roles">
              {user.roles.join(", ")}
            </span>
          ) : null}
          <button
            type="button"
            className="main-layout-logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="main-layout-content">
        <Outlet />
      </main>
    </div>
  );
}
