"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeEstimate } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";

export type LeadFormState =
  | { status: "error"; error: string }
  | { status: "success"; min: number; max: number }
  | null;

export async function submitLeadAction(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const slug = String(formData.get("slug") ?? "");
  const answersJson = String(formData.get("answersJson") ?? "{}");
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "")
    .trim()
    .toLowerCase();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();

  if (!contactName || !contactPhone) {
    return { status: "error", error: "Merci de renseigner ton nom et ton téléphone." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { status: "error", error: "Cette adresse e-mail n'est pas valide." };
  }

  const user = await prisma.user.findUnique({
    where: { slug },
    include: { questions: { include: { options: true } } },
  });
  if (!user) {
    return { status: "error", error: "Ce questionnaire n'existe plus." };
  }

  let selections: Record<string, string> = {};
  try {
    selections = JSON.parse(answersJson);
  } catch {
    selections = {};
  }

  const selectedOptions = user.questions
    .map((question) => {
      const optionId = selections[question.id];
      return question.options.find((option) => option.id === optionId);
    })
    .filter((option): option is NonNullable<typeof option> => Boolean(option));

  const { min, max } = computeEstimate(
    user.basePriceMin,
    user.basePriceMax,
    selectedOptions
  );

  await prisma.lead.create({
    data: {
      userId: user.id,
      answersJson,
      estimatedMin: min,
      estimatedMax: max,
      contactName,
      contactEmail,
      contactPhone,
    },
  });

  return { status: "success", min, max };
}

export async function markLeadContactedAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const leadId = String(formData.get("leadId") ?? "");
  await prisma.lead.updateMany({
    where: { id: leadId, userId: user.id },
    data: { status: "CONTACTED" },
  });

  revalidatePath("/demandes");
}
