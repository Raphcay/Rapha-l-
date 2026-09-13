"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toInt(value: FormDataEntryValue | null): number {
  const parsed = parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  return user;
}

export async function updateBasePriceAction(formData: FormData) {
  const user = await requireUser();
  const basePriceMin = toInt(formData.get("basePriceMin"));
  const basePriceMax = toInt(formData.get("basePriceMax"));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      basePriceMin: Math.max(0, basePriceMin),
      basePriceMax: Math.max(0, basePriceMax),
    },
  });

  revalidatePath("/questionnaire");
}

export async function addQuestionAction(formData: FormData) {
  const user = await requireUser();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  const count = await prisma.question.count({ where: { userId: user.id } });
  await prisma.question.create({
    data: { userId: user.id, label, order: count },
  });

  revalidatePath("/questionnaire");
}

export async function updateQuestionLabelAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  await prisma.question.updateMany({
    where: { id: questionId, userId: user.id },
    data: { label },
  });

  revalidatePath("/questionnaire");
}

export async function deleteQuestionAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "");

  await prisma.question.deleteMany({
    where: { id: questionId, userId: user.id },
  });

  revalidatePath("/questionnaire");
}

export async function addOptionAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const priceDeltaMin = toInt(formData.get("priceDeltaMin"));
  const priceDeltaMax = toInt(formData.get("priceDeltaMax"));
  if (!label) return;

  const question = await prisma.question.findFirst({
    where: { id: questionId, userId: user.id },
    include: { options: true },
  });
  if (!question) return;

  await prisma.questionOption.create({
    data: {
      questionId,
      label,
      order: question.options.length,
      priceDeltaMin,
      priceDeltaMax,
    },
  });

  revalidatePath("/questionnaire");
}

export async function deleteOptionAction(formData: FormData) {
  const user = await requireUser();
  const optionId = String(formData.get("optionId") ?? "");

  await prisma.questionOption.deleteMany({
    where: { id: optionId, question: { userId: user.id } },
  });

  revalidatePath("/questionnaire");
}
