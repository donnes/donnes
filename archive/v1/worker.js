// next/image asks for /_next/image?url=<source>&w=&q=. The frozen site has no optimizer, so each source maps to a stored file.
export default {
  fetch(request, env) {
    const source = new URL(request.url).searchParams.get("url") ?? "";
    const path = source.startsWith("/") ? source : `/_media/${source.split("/").pop()}.webp`;
    return env.ASSETS.fetch(new URL(path, request.url));
  },
};
