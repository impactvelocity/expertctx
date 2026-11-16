import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getExpertByOwner, getProfile } from "./data";

/** Admins are set in Clerk: user → public metadata → { "role": "admin" }. */
export async function isAdmin() {
  const user = await currentUser();
  return (user?.publicMetadata as { role?: string } | undefined)?.role === "admin";
}

export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

/** The signed-in user's expert record, or a redirect to onboarding. */
export async function requireExpert() {
  const userId = await requireUserId();
  const expert = await getExpertByOwner(userId);
  if (!expert) redirect("/studio");
  return { userId, expert };
}

/** A profile the signed-in user owns, or throws. */
export async function requireOwnProfile(profileId: string) {
  const { userId, expert } = await requireExpert();
  const profile = await getProfile(profileId);
  if (!profile || profile.expertId !== expert.id) throw new Error("Profile not found");
  return { userId, expert, profile };
}
