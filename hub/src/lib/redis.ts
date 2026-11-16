import "server-only";
import { Redis } from "@upstash/redis";

// The Vercel Marketplace names these KV_REST_API_*; a direct Upstash setup
// names them UPSTASH_REDIS_REST_*. Accept either.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});
