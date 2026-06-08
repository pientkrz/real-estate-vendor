import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: import.meta.env.BLOG_CONTENT_PATH }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		author: z.string().optional(),
		thumbnail: z.string().optional(),
		category: z.string().optional(),
	}),
});

export const collections = { blog };
