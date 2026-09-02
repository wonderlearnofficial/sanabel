import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { localStore } from "../utils/safeStorage";

interface AdminRouteProps extends Omit<RouteProps, "component"> {
  component: React.ComponentType<any>;
}

// Client-side UX guard only — real access control is enforced server-side
// by the checkAdmin middleware on every /admin/* API call.
const AdminRoute: React.FC<AdminRouteProps> = ({ component: Component, ...rest }) => {
  const token = localStore.getItem("token");
  const role = localStore.getItem("role");
  const isAuthorizedAdmin = !!token && role === "Admin";

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthorizedAdmin ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

export default AdminRoute;
