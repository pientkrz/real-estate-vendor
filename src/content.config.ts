import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const privacyPolicy = defineCollection({
	loader: glob({ pattern: "**/*.md", base: import.meta.env.PRIVACY_POLICY_CONTENT_PATH }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
	}),
});

export const collections = { privacyPolicy };
