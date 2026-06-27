import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  exportJWK,
  exportPKCS8,
  generateKeyPair,
  importPKCS8,
  SignJWT,
} from "jose";

const dir = "docker/libsql";
const privatePath = `${dir}/private.pem`;
const serverEnvPath = `${dir}/server.env`;

await mkdir(`${dir}/data`, { recursive: true });

let privateKey: Awaited<ReturnType<typeof importPKCS8>>;

if (existsSync(privatePath)) {
  privateKey = await importPKCS8(await readFile(privatePath, "utf8"), "EdDSA");
} else {
  const pair = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  privateKey = pair.privateKey;
  await writeFile(privatePath, await exportPKCS8(pair.privateKey));
  const jwk = await exportJWK(pair.publicKey);
  await writeFile(serverEnvPath, `SQLD_AUTH_JWT_KEY=${jwk.x}\n`);
}

const token = await new SignJWT({})
  .setProtectedHeader({ alg: "EdDSA" })
  .setIssuedAt()
  .setExpirationTime("8760h")
  .sign(privateKey);

console.log("libSQL local JWT ready.");
console.log(`server key: ${serverEnvPath}`);
console.log("Add the following to .env.local:");
console.log(`TURSO_AUTH_TOKEN=${token}`);
