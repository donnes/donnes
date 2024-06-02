import { defineCollection, z } from "astro:content";

const experiences = defineCollection({
  type: "content",
  schema: z.object({
    role: z.string(),
    company: z.string(),
    link: z.string(),
    description: z.array(z.string()),
    startYear: z.string(),
    endYear: z.string().optional(),
  }),
});

export const collections = {
  experiences,
};
