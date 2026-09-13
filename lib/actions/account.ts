"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyPassword, destroySession } from "@/lib/auth";

export type DeleteAccountState = { error: string } | null;

export async function deleteAccountAction(
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const password = String(formData.get("password") ?? "");
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Mot de passe incorrect." };
  }

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
