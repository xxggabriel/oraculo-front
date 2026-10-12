import { readFile, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const producer = resolve(
  process.env.ORACULO_CONTRACT_DIR ?? "../oraculo-back/contracts",
);
const names = [
  "openapi.json",
  "generated/api.ts",
  "generated/validators.js",
  "generated/validators.d.ts",
  "generated/contract.sha256",
];
if (process.argv[2] === "sync") {
  await mkdir("contracts/generated", { recursive: true });
  for (const name of names)
    await copyFile(resolve(producer, name), resolve("contracts", name));
  console.log("Contrato consumido atualizado a partir do produtor.");
} else {
  const spec = await readFile("contracts/openapi.json");
  const digest = createHash("sha256").update(spec).digest("hex");
  const expected = (
    await readFile("contracts/generated/contract.sha256", "utf8")
  ).trim();
  if (digest !== expected) throw Error("Checksum do contrato divergente");
  for (const name of names) {
    const [local, remote] = await Promise.all([
      readFile(resolve("contracts", name)),
      readFile(resolve(producer, name)),
    ]);
    if (!local.equals(remote))
      throw Error(`Artefato divergente do produtor: ${name}`);
  }
  console.log("Contrato e artefatos coincidem com o produtor.");
}
