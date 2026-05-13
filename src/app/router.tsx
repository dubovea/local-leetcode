import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { ProblemPage } from "@/pages/problem-page/ui/ProblemPage";

const rootRoute = createRootRoute({
  component: ProblemPage,
});

const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
});

const problemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "problems/$problemId",
});

const practiceHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "practice-history",
});

const routeTree = rootRoute.addChildren([workspaceRoute, problemRoute, practiceHistoryRoute]);

const basepath =
  import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createRouter({
  basepath,
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
