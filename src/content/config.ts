import { defineCollection, z } from "astro:content";

const experiences = defineCollection({
  type: "content",
  schema: z.object({
    startYear: z.string(),
    endYear: z.string().optional(),
    role: z.string(),
    company: z.string(),
    link: z.string(),
    description: z.array(z.string()),
  }),
});

export const collections = {
  experiences,
};
