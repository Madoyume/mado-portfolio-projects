import { jwtVerify, SignJWT } from "jose";
import { SESSION_MAX_AGE_SECONDS } from "./constants";
import { getAuthEnv } from "./env";

const alg = "HS256";
const subject = "admin";

function key() {
  return new TextEncoder().encode(getAuthEnv().SESSION_SECRET);
}

export async function createSession() {
  const issuedAt = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg })
    .setSubject(subject)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_MAX_AGE_SECONDS)
    .sign(key());
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.sub === subject;
  } catch {
    return false;
  }
}
