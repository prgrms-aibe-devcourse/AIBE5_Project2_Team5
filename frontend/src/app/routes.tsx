import type { ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from "react-router";
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

type PickxelPageKind =
  | "landing"
  | "auth"
  | "app"
  | "messages"
  | "editorial"
  | "workspace";

function usePickxelPageKind(): PickxelPageKind {
  const { pathname } = useLocation();
  if (pathname === "/") return "landing";
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/password-reset" ||
    pathname.startsWith("/oauth2/")
  ) {
    return "auth";
  }
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/review")) return "editorial";
  if (pathname.startsWith("/projects")) return "workspace";
  return "app";
}

function RootLayout() {
  const kind = usePickxelPageKind();
  const wrapperClass = {
    landing: "min-h-full",
    auth: "min-h-full text-base sm:text-[1.0625rem] leading-relaxed",
    app: "min-h-full text-base leading-relaxed tracking-normal",
    messages: "min-h-full text-base sm:text-[1.0625rem] leading-relaxed",
    editorial: "min-h-full font-serif text-base sm:text-lg leading-[1.75]",
    workspace: "min-h-full text-base leading-normal",
  }[kind];

  return (
    <div className={wrapperClass} data-pickxel-page={kind}>
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "oauth2/redirect", Component: OAuth2Redirect },
      { path: "password-reset", Component: PasswordReset },
      { path: "feed", element: protect(<Feed />) },
      { path: "explore", element: protect(<Explore />) },
      { path: "collections", element: protect(<Collections />) },
      { path: "profile/:username", element: protect(<Profile />) },
      { path: "notifications", element: protect(<Notifications />) },
      { path: "messages", element: protect(<Messages />) },
      { path: "projects", Component: Projects },
      { path: "projects/new", element: protect(<CreateProject />) },
      { path: "projects/:id", element: protect(<ProjectDetail />) },
      { path: "review/write", element: protect(<ReviewWrite />) },
    ],
  },
]);
