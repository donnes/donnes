import { defineCollection, z } from "astro:content";

const experiences = defineCollection({
  type: "content",
  schema: z.object({
    startYear: z.string(),
    /** short month name, shown before the start year when the month matters */
    startMonth: z.string().optional(),
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
