import {
  CONTACT_ENC_ALGO,
  CONTACT_ENC_IV_BYTES,
  CONTACT_ENC_KEY_BYTES,
} from "./constants";

let keyPromise: Promise<CryptoKey> | undefined;

function getKey() {
  keyPromise ??= (async () => {
    const b64 = process.env.CONTACT_ENC_KEY;
    if (!b64) throw new Error("CONTACT_ENC_KEY is not set");
    const raw = Buffer.from(b64, "base64");
    if (raw.length !== CONTACT_ENC_KEY_BYTES) {
      throw new Error(
        `CONTACT_ENC_KEY must be ${CONTACT_ENC_KEY_BYTES} bytes (base64)`,
      );
    }
    return crypto.subtle.importKey("raw", raw, CONTACT_ENC_ALGO, false, [
      "encrypt",
      "decrypt",
    ]);
  })().catch((err) => {
    keyPromise = undefined;
    throw err;
  });
  return keyPromise;
}

export async function encryptText(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(CONTACT_ENC_IV_BYTES));
  const encrypted = await crypto.subtle.encrypt(
    { name: CONTACT_ENC_ALGO, iv },
    await getKey(),
    new TextEncoder().encode(plain),
  );
  return `${Buffer.from(iv).toString("base64")}.${Buffer.from(encrypted).toString("base64")}`;
}

export async function decryptText(stored: string) {
  const [iv, data] = stored.split(".");
  const decrypted = await crypto.subtle.decrypt(
    { name: CONTACT_ENC_ALGO, iv: Buffer.from(iv, "base64") },
    await getKey(),
    Buffer.from(data, "base64"),
  );
  return new TextDecoder().decode(decrypted);
}
