import { createBrowserRouter } from "react-router";
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
import ReviewWrite from "./pages/ReviewWrite";

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
    path: "/feed",
    Component: Feed,
  },
  {
    path: "/explore",
    Component: Explore,
  },
  {
    path: "/collections",
    Component: Collections,
  },
  {
    path: "/profile/:username",
    Component: Profile,
  },
  {
    path: "/notifications",
    Component: Notifications,
  },
  {
    path: "/messages",
    Component: Messages,
  },
  {
    path: "/projects",
    Component: Projects,
  },
  {
    path: "/projects/new",
    Component: CreateProject,
  },
  {
    path: "/projects/:id",
    Component: ProjectDetail,
  },
  {
    path: "/review/write",
    Component: ReviewWrite,
  },
]);