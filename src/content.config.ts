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
		categories: z.array(z.string().trim().min(1)).min(1).optional(),
		// Compatibility with articles created before multiple categories were supported.
		category: z.string().optional(),
	}),
});

const privacyPolicy = defineCollection({
	loader: glob({ pattern: "**/*.md", base: import.meta.env.PRIVACY_POLICY_CONTENT_PATH }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
	}),
});

export const collections = { blog, privacyPolicy };
