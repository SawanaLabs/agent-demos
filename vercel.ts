import { withEve } from "eve/vercel";

export default await withEve({
  services: {
    web: {
      framework: "nextjs",
      root: "apps/web",
    },
  },
  routes: [
    {
      src: "^(.*)$",
      destination: { type: "service", service: "web" },
    },
  ],
  crons: [
    {
      path: "/api/cron/customer-memory-agent-cleanup",
      schedule: "0 20 * * *",
    },
    {
      path: "/api/cron/persistent-agent-cleanup",
      schedule: "0 20 * * *",
    },
    {
      path: "/api/cron/site-usage-cleanup",
      schedule: "0 20 * * *",
    },
    {
      path: "/api/cron/ultra-chatbot-agent-cleanup",
      schedule: "0 20 * * *",
    },
    {
      path: "/api/cron/vercel-sandbox-cleanup",
      schedule: "0 21 * * *",
    },
  ],
});
