"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth/session";

/** Logout Server Action: clears the session cookie, invalidates the session record, and redirects to /login. */
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
