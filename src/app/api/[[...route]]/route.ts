import { app } from "@/server";

export const dynamic = "force-dynamic";

const handler = (req: Request) => app.fetch(req);

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
