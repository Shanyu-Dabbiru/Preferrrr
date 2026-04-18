# Preferrrr 🛍️

> Your personal "Bullshit Checker" for e-commerce product reviews.

Paste any product link and get an instant, honest analysis — real reviews only, no sponsored fluff. Plus 3 genuinely better alternatives.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Vanilla CSS (Glassmorphic UI)
- **Backend**: Vercel AI SDK v6 + OpenAI GPT-4o
- **Scraping**: Jina Reader API (zero-config, free-tier web scraping)
- **Architecture**: Single LLM call with tool-use for real-time product extraction

## Getting Started

```bash
# 1. Clone and install
cd bot
npm install

# 2. Add your OpenAI API key
cp ../.env.example .env.local
# Edit .env.local with your key

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste a product URL (Gymshark, Allbirds, etc.)

## How It Works

1. You share a product link in the chat
2. The LLM calls the `scrape_product_url` tool → Jina Reader extracts the page as markdown
3. GPT-4o analyzes the content: filters sponsored reviews, identifies genuine sentiment
4. Returns a summary + 3 alternative product recommendations

## License

MIT
