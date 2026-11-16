import { uploads } from "@/lib/uploads";

// A recording is transcribed after the upload completes; give that room.
export const maxDuration = 300;

export const { GET, POST } = uploads;
