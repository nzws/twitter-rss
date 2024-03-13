import { Elysia } from "elysia";
import type { Env } from "./lib/env";
import { apiRoute } from "./routes/api";

const app = new Elysia({ aot: false }).use(apiRoute);

export default {
  fetch: (request: Request, env: Env) => {
    return app.state("env", env).fetch(request);
  },
};
