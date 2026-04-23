import type { ReactNode } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Collections from "./pages/Collections";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OAuth2Redirect from "./pages/OAuth2Redirect";
import PasswordReset from "./pages/PasswordReset";
import ReviewWrite from "./pages/ReviewWrite";
import { isAuthenticated } from "./utils/auth";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (isAuthenticated()) {
    return children;
  }

  return (
    <Navigate
      to="/login"
      replace
      state={{
        redirectTo: `${location.pathname}${location.search}`,
        message: "로그인이 필요한 페이지입니다.",
      }}
    />
  );
}

function protect(children: ReactNode) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/oauth2/redirect",
    Component: OAuth2Redirect,
  },
  {
    path: "/password-reset",
    Component: PasswordReset,
  },
  {
    path: "/feed",
    element: protect(<Feed />),
  },
  {
    path: "/explore",
    element: protect(<Explore />),
  },
  {
    path: "/collections",
    element: protect(<Collections />),
  },
  {
    path: "/profile/:username",
    element: protect(<Profile />),
  },
  {
    path: "/notifications",
    element: protect(<Notifications />),
  },
  {
    path: "/messages",
    element: protect(<Messages />),
  },
  {
    path: "/projects",
    Component: Projects,
  },
  {
    path: "/projects/new",
    element: protect(<CreateProject />),
  },
  {
    path: "/projects/:id",
    element: protect(<ProjectDetail />),
  },
  {
    path: "/review/write",
    element: protect(<ReviewWrite />),
  },
]);
