import { Elysia, t } from "elysia";
import type { Env } from "../lib/env";
import { createRestAPIClient } from "masto";

const campaignRegex = /その場で当たるチャンス|本投稿をリポスト/;

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
        console.log(body);
        const env = (store as Record<string, unknown>)["env"] as Env;

        const accounts = Object.fromEntries(
          env.TOKEN_LIST.split(",")
            .map((token) => token.trim().split(":"))
            .filter(
              (e): e is [string, string] => !!(e.length === 2 && e[0] && e[1]),
            ),
        );

        const token = accounts[body.UserName];
        if (!token) {
          console.log("User not found", body.UserName);
          return { success: false, reason: "User not found" };
        }

        const masto = createRestAPIClient({
          url: env.MASTODON_ENDPOINT,
          accessToken: token,
        });

        const text = body.Text.replaceAll("@", "@.");
        if (campaignRegex.test(text)) {
          console.log("Campaign post was skipped", text, body.LinkToTweet);
          return { success: false, reason: "Campaign post was skipped" };
        }

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
