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
import { z } from 'zod';

export const maxDuration = 60;

const tools = {
  scrape_product_url: tool({
    description:
      'Scrape a product URL to read reviews, features, and content on the page. Use this whenever the user shares a product link.',
    inputSchema: z.object({
      url: z
        .string()
        .describe(
          'The full URL of the product to scrape (e.g. https://www.gymshark.com/products/...)'
        ),
    }),
    execute: async ({ url }) => {
      try {
        console.log('Scraping with Jina:', url);
        const response = await fetch(`https://r.jina.ai/${url}`, {
          headers: {
            Accept: 'text/markdown',
          },
        });
        if (!response.ok) {
          return `Failed to scrape ${url}. The site may be blocking scrapers. Analyze based on your general knowledge of this product instead.`;
        }
        const markdown = await response.text();
        // Truncate to fit within token limits for the POC
        return markdown.slice(0, 12000);
      } catch (e) {
        return `Failed to fetch from ${url}. Analyze based on your general knowledge instead.`;
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
    system: `You are "Preferrrr" — a brutally honest product review analyst and personal shopper assistant.

When a user shares a product link:
1. Immediately USE the "scrape_product_url" tool to extract the live page content.
2. Analyze the scraped content: identify real customer reviews vs sponsored/fake fluff.
3. Give a concise sentiment summary (what real customers love and hate).
4. Recommend exactly 3 alternative products that genuinely do specific things better, with real reasoning.
5. Format your response in clean markdown with headers and bullet points.

Be conversational, honest and opinionated. Use emoji sparingly for personality. Never be generic.`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
