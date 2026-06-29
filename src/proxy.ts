import type { NextRequest } from "next/server";

const REALM = "Restricted";

function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

function isGateEnabled() {
  const env = process.env.VERCEL_ENV;
  if (env === "preview") return true;
  if (env === "production") return process.env.BASIC_AUTH_ENABLED === "true";
  return false;
}

export function proxy(request: NextRequest) {
  if (!isGateEnabled()) return;

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;
  if (!expectedUser || !expectedPassword) return unauthorized();

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  const decoded = atob(header.slice("Basic ".length));
  const separator = decoded.indexOf(":");
  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  if (user !== expectedUser || password !== expectedPassword) {
    return unauthorized();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
