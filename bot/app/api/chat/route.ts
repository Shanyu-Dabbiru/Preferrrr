import { openai } from '@ai-sdk/openai';
import {
  streamText,
  tool,
  stepCountIs,
  type ToolSet,
  type InferUITools,
  type UIDataTypes,
  type UIMessage,
  convertToModelMessages,
} from 'ai';
import { ApifyClient } from 'apify-client';
import { z } from 'zod';

export const maxDuration = 60;

const tools = {
  scrape_product_url: tool({
    description:
      'Scrape a competitor product URL to extract customer reviews and product capabilities. Use this immediately when a user shares a link.',
    inputSchema: z.object({
      url: z
        .string()
        .describe(
          'The full URL of the competitor product to scrape (e.g. https://www.gymshark.com/...)'
        ),
    }),
    execute: async ({ url }) => {
      try {
        console.log('Scraping with Apify:', url);
        if (!process.env.APIFY_API_TOKEN) {
          return 'Missing APIFY_API_TOKEN. Please set it in .env.local to use the Apify Web Scraper.';
        }
        
        const client = new ApifyClient({
            token: process.env.APIFY_API_TOKEN,
        });

        // Run the Apify Website Content Crawler for immediate markdown extraction
        const run = await client.actor("apify/website-content-crawler").call({
            startUrls: [{ url }],
            maxCrawlPages: 1,
            crawlerType: "playwright:adaptive",
        });

        // Fetch the results
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (!items || items.length === 0) {
           return `Failed to scrape ${url}. The site may be blocking scrapers.`;
        }

        const textContent = String(items[0]?.markdown || items[0]?.text || '');
        return textContent.slice(0, 12000);
      } catch (e) {
        return `Failed to fetch from ${url} using Apify. Error: ${String(e)}`;
      }
    },
  }),
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a cutthroat GTM (Go-To-Market) competitive intelligence agent.

When a user shares a competitor's product link:
1. Immediately USE the "scrape_product_url" tool to extract the live page content and reviews.
2. Analyze the scraped content specifically for CUSTOMER COMPLAINTS, flaws, and missing features (1 and 2-star reviews).
3. Build a precise ICP (Ideal Customer Profile) for the frustrated buyers of this product.
4. Output exactly 3 high-converting Meta Ad Copy variants designed to steal this specific frustrated ICP away from the competitor, ensuring that our product is positioned as the exact solution to the competitor's flaws.
5. Provide a conceptual image generation prompt that could be fed into Pixero.ai to generate the ad creative.

Format your response in clean markdown:
- **Competitor Flaws (The Hook):** What customers hate about the product.
- **Target ICP:** Who we are targeting.
- **Meta Ad Copy:** 3 distinct variants (Short, Story-driven, Product-focused).
- **Pixero Creative Prompt:** Visual prompt for the ad.

Be sharp, highly actionable, and marketing-focused. Always include a call-to-action in the ad copy.`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
