// /llms.txt — the beach as plain Markdown for language models (https://llmstxt.org).
// Built from the same profile, stack and roles the homepage renders, so it never drifts.
import type { APIRoute } from "astro";

import { getExperiences, getProfile, getStack } from "../lib/beach/data";

const lang = "en";

// role descriptions carry inline <strong>/<a>; keep the words, drop the tags
const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL("https://donnes.dev")).origin;
  const profile = getProfile(lang);
  const stack = getStack(lang);
  const experiences = await getExperiences(lang);

  const roles = experiences.map(({ data }) => {
    const years = `${data.startYear}–${data.endYear ?? "Present"}`;
    const bullets = data.description.map((d) => `- ${plain(d)}`).join("\n");
    return `### ${data.role} at ${data.company} (${years})\n\n${data.link}\n\n${bullets}`;
  });

  const tools = stack.map((g) => {
    const lines = [`- **${g.group}**: ${g.items.join(", ")}`];
    for (const c of g.capabilities ?? []) lines.push(`  - ${c}`);
    return lines.join("\n");
  });

  const body = `# ${profile.name}

> ${profile.role} based in ${profile.city}. ${profile.summary}

${profile.tagline} The site at ${origin} is a single illustrated, interactive beach scene: work, about, stack and contact are objects left on the sand. This file is the same content as plain text.

## Contact

- Email: ${profile.email}
- CV: ${profile.cvLink}
${profile.socials.map((s) => `- ${s.label}: ${s.href}`).join("\n")}

## Work

${roles.join("\n\n")}

## Stack

${tools.join("\n")}

## Pages

- [Home](${origin}/): the beach, with Work, About, Stack and Contact
- [Colophon](${origin}/colophon/): how this digital beach was designed and built
- [Início (português)](${origin}/pt-br/): the same beach in Brazilian Portuguese

## Optional

- [Sitemap](${origin}/sitemap-index.xml)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
