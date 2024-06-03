import { defineCollection, z } from "astro:content";

const experiences = defineCollection({
  type: "content",
  schema: z.object({
    startYear: z.string(),
    endYear: z.string().optional(),
    role: z.string(),
    company: z.string(),
    link: z.string(),
    description: z.object({
      en: z.array(z.string()),
      "pt-br": z.array(z.string()),
    }),
  }),
});

const sections = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    role: z.string(),
  }),
});

export const collections = {
  experiences,
  sections,
};
