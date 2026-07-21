"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { userExists as userExistsQuery } from "@/lib/auth/queries";

export type AuthResult = { ok: true } | { ok: false; error: string };

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
  password: z.string().min(8),
});

export async function userExists(): Promise<boolean> {
  return userExistsQuery();
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and a password of at least 8 characters." };
  }
  if (await userExistsQuery()) {
    return { ok: false, error: "An account already exists." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  let user;
  try {
    user = await prisma.user.create({
      data: { email: parsed.data.email, passwordHash },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "An account already exists." };
    }
    throw e;
  }
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  return { ok: true };
}

export async function login(formData: FormData): Promise<AuthResult> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid email or password." };
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "Invalid email or password." };
  }
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  return { ok: true };
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
