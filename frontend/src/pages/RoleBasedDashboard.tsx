import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Dashboard } from "./Dashboard";
import { CustomerDashboard } from "./CustomerDashboard";
import { WaiterDashboard } from "./WaiterDashboard";

export function RoleBasedDashboard() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Show Customer Dashboard for users with CUSTOMER role
  if (user?.roles?.includes("CUSTOMER")) {
    return <CustomerDashboard />;
  }

  // Show Waiter Dashboard for users with WAITER role
  if (user?.roles?.includes("WAITER")) {
    return <WaiterDashboard />;
  }

  // Show Admin/Staff Dashboard for other roles
  return <Dashboard />;
}
