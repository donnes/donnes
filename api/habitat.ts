import type { IncomingMessage, ServerResponse } from "node:http";
import { createEndpoint } from "../src/lib/habitat/endpoint.js";
const habitat = createEndpoint(process.env);
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const response = await habitat(new URL(req.url || "/", "https://donnes.dev"), req.method);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}
