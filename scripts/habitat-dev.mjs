// Serve the same Vercel endpoint during `astro dev`, without turning the static site into SSR.
export default function habitatDev() {
  return {
    name: "habitat-dev",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => updateConfig({ vite: { plugins: [{
        name: "habitat-endpoint",
        configureServer(server) {
          let endpoint;
          server.watcher.on("change", file => {
            if (file.includes("/src/lib/habitat/") || /\/\.env(?:\.|$)/.test(file)) endpoint = undefined;
          });
          server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url || "/", "http://localhost");
            if (url.pathname !== "/api/habitat") return next();
            try {
              if (!endpoint) {
                endpoint = Promise.all([
                  server.ssrLoadModule("/src/lib/habitat/endpoint.ts"), import("vite"),
                ]).then(([{ createEndpoint }, { loadEnv }]) => createEndpoint(loadEnv(server.config.mode, server.config.envDir, "")));
              }
              const response = await (await endpoint)(url, req.method);
              res.writeHead(response.status, Object.fromEntries(response.headers));
              res.end(await response.text());
            } catch (error) { endpoint = undefined; next(error); }
          });
        },
      }] } }),
    },
  };
}
