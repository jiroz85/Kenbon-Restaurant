import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGuard } from "./components/RoleGuard";
import { MainLayout } from "./layouts/MainLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RoleBasedDashboard } from "./pages/RoleBasedDashboard";
import { Orders } from "./pages/Orders";
import { OrderDetail } from "./pages/OrderDetail";
import { Menu } from "./pages/Menu";
import { MenuWithTable } from "./pages/MenuWithTable";
import { Kitchen } from "./pages/Kitchen";
import { Delivery } from "./pages/Delivery";
import { Inventory } from "./pages/Inventory";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RoleBasedDashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="menu" element={<Menu />} />
            <Route path="menu/table" element={<MenuWithTable />} />
            <Route
              path="kitchen"
              element={
                <RoleGuard allowedRoles={["ADMIN", "MANAGER", "KITCHEN"]}>
                  <Kitchen />
                </RoleGuard>
              }
            />
            <Route
              path="delivery"
              element={
                <RoleGuard allowedRoles={["ADMIN", "MANAGER", "DELIVERY"]}>
                  <Delivery />
                </RoleGuard>
              }
            />
            <Route
              path="inventory"
              element={
                <RoleGuard allowedRoles={["ADMIN", "MANAGER", "KITCHEN"]}>
                  <Inventory />
                </RoleGuard>
              }
            />
            <Route
              path="users"
              element={
                <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
                  <Users />
                </RoleGuard>
              }
            />
            <Route
              path="settings"
              element={
                <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
                  <Settings />
                </RoleGuard>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
