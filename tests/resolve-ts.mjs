// The habitat lib imports its siblings as "./x.js" (the shape Vercel bundles); under node --experimental-strip-types
// there is no .js on disk, so map a missing ./x.js to ./x.ts. Test-only; production bundlers resolve these themselves.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`
  import { existsSync } from "node:fs";
  import { fileURLToPath } from "node:url";
  export async function resolve(specifier, context, next) {
    if (specifier.startsWith(".") && specifier.endsWith(".js") && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (!existsSync(fileURLToPath(url))) return next(specifier.slice(0, -3) + ".ts", context);
    }
    return next(specifier, context);
  }
`), import.meta.url);
