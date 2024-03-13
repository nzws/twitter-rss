import { Elysia, t } from "elysia";
import type { Env } from "../lib/env";
import { createRestAPIClient } from "masto";

export const apiRoute = new Elysia({ aot: false }).guard(
  {
    beforeHandle({ store, set, query }) {
      const env = (store as Record<string, unknown>)["env"] as Env;
      if (env.SIGNATURE_TOKEN === query.token) {
        return;
      }

      return (set.status = "Unauthorized");
    },
    query: t.Object({
      token: t.String(),
    }),
  },
  (app) =>
    app.post(
      "/post",
      async ({ body, store }) => {
        const env = (store as Record<string, unknown>)["env"] as Env;
        const masto = createRestAPIClient({
          url: env.MASTODON_ENDPOINT,
          accessToken: env.MASTODON_TOKEN,
        });

        const text = body.Text.replaceAll("@", "@.");

        await masto.v1.statuses.create({
          status: `${text}\n\n${body.LinkToTweet}`,
          visibility: "unlisted",
        });

        return { success: true };
      },
      {
        body: t.Object({
          Text: t.String(),
          UserName: t.String(),
          LinkToTweet: t.String(),
        }),
      },
    ),
);
