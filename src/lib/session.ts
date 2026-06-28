import { jwtVerify, SignJWT } from "jose";
import { getAuthEnv } from "./env";

const alg = "HS256";
const subject = "admin";

function key() {
  return new TextEncoder().encode(getAuthEnv().SESSION_SECRET);
}

export async function createSession() {
  return new SignJWT({})
    .setProtectedHeader({ alg })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("7d")
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
