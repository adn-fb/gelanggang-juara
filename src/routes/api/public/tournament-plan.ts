import { createFileRoute } from "@tanstack/react-router";
import { handlePlanner } from "@/lib/planner.server";
export const Route = createFileRoute("/api/public/tournament-plan")({
  server: { handlers: { POST: ({ request }) => handlePlanner(request) } },
});
