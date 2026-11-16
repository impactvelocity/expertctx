This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Knowledge ingestion

Experts add sources to a profile from one capture box in the studio. Each kind is read by a different service; set the keys in `.env.local` (and in Vercel) to turn each one on.

| Source | Read by | Env var | Without it |
| --- | --- | --- | --- |
| Web pages, public PDFs | [Jina Reader](https://jina.ai/reader) | `JINA_API_KEY` | Works, capped at 20 reads a minute for the whole hub |
| YouTube, TikTok, Instagram, X and LinkedIn posts | [Scrape Creators](https://scrapecreators.com) | `SCRAPE_CREATORS_API_KEY` | Videos and posts fail with a message saying the key is missing |
| Uploaded audio and video, voice notes | [Deepgram](https://deepgram.com), then [ElevenLabs Scribe](https://elevenlabs.io/speech-to-text) if Deepgram has no key or fails | `DEEPGRAM_API_KEY`, `ELEVEN_LABS_API_KEY` | With neither set, recordings fail with a message saying so |
| Link previews (title, thumbnail, favicon) | [iframe.ly](https://iframely.com) | `IFRAMELY_API_KEY` (the account key, or its MD5 hash) | Falls back to the page's own Open Graph tags |

Uploaded PDFs and text files are read in-process. Files go from the browser straight to Upstash Blob through `/api/upload`, so large recordings aren't limited by the request body cap.
