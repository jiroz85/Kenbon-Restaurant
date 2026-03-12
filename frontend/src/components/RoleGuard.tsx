import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const hasRole = allowedRoles.some((r) => roles.includes(r));

  if (!hasRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
