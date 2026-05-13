import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/servidores")({
  component: () => <Outlet />,
  head: () => ({
    meta: [
      { title: "Servidores — CS Nostalgia" },
      {
        name: "description",
        content: "Lista completa dos servidores CS 1.6 da CS Nostalgia.",
      },
    ],
  }),
});
