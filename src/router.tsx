import { createRouter, createMemoryHistory, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function AppErrorComponent({
  error,
}: {
  error: unknown;
}): React.ReactElement {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    <div
      role="alert"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#020817",
        color: "#f8fafc",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <div>
        <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</p>
        <p>{errorMessage}</p>
      </div>
    </div>
  );
}

export function getRouter() {
  const isServer = typeof window === "undefined";

  // Use memory history on the server, and hash history on the client
  const history = isServer
    ? createMemoryHistory({ initialEntries: ["/"] })
    : createHashHistory();

  const router = createRouter({
    routeTree,
    history,
    defaultErrorComponent: AppErrorComponent,
    defaultPreload: "intent",
    defaultPreloadDelay: 20,
  });

  // Attach Capacitor back button listener on the client side only
  if (!isServer) {
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", () => {
        const hash = window.location.hash;
        const isHome = !hash || hash === "#/" || hash === "#" || hash === "#/index";

        if (!isHome) {
          window.history.back();
        }
        // Once home, remain strictly null (no-op, won't exit the app)
      });
    }).catch(() => {});
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
