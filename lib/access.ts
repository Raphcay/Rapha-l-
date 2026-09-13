import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

export function requireActiveAccess(user: User): void {
  const trialActive = user.trialEndsAt ? user.trialEndsAt > new Date() : false;
  const hasAccess = user.subscriptionStatus === "active" || trialActive;

  if (!hasAccess) {
    redirect("/parametres?essai=termine");
  }
}
