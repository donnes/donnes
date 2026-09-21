import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
const temp = await mkdtemp(join(tmpdir(), "habitat-tests-"));
try {
  await writeFile(join(temp, "package.json"), '{"type":"module"}');
  for (const name of ["usage", "plan", "director", "tennis", "typesafe", "endpoint"]) {
    const source = await readFile(`src/lib/habitat/${name}.ts`, "utf8");
    await writeFile(join(temp, `${name}.js`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  }
  const { runTennis } = await import("../tests/tennis.mjs");
  await runTennis(await import(pathToFileURL(join(temp, "tennis.js"))), await import(pathToFileURL(join(temp, "typesafe.js"))));
  const { run } = await import("../tests/habitat.mjs");
  await run(await import(pathToFileURL(join(temp, "plan.js"))), await import(pathToFileURL(join(temp, "director.js"))), await import(pathToFileURL(join(temp, "endpoint.js"))));
} finally { await rm(temp, { recursive: true, force: true }); }
