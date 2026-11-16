import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isStudio = createRouteMatcher(["/studio(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isStudio(request)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, and the Forge API (it uses its own token).
    "/((?!_next|api/forge|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api(?!/forge)|trpc)(.*)",
  ],
};
