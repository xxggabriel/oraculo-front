import { readdir, readFile } from "node:fs/promises";
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await check(path);
    else if (entry.name.endsWith(".ts")) {
      const source = await readFile(path, "utf8");
      if (
        /from\s+['"][^'"]*(?:@angular|adapters|composition|contracts|elasticsearch)/.test(
          source,
        )
      )
        throw Error(`Dependência da borda no núcleo: ${path}`);
      if (/:\s*any\b|<any>|\bas any\b/.test(source))
        throw Error(`Tipo any no núcleo: ${path}`);
    }
  }
}
await check("src/app/core");
await check("src/app/application");
async function checkShared(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await checkShared(path);
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) {
      const source = await readFile(path, "utf8");
      if (
        /from\s+['"][^'"]*\/(?:features|application|adapters|composition|contracts)\//.test(
          source,
        )
      )
        throw Error(
          `Componente compartilhado depende de página ou transporte: ${path}`,
        );
    }
  }
}
await checkShared("src/app/shared");
console.log(
  "Fronteiras domínio/aplicação e componentes compartilhados verificadas.",
);
