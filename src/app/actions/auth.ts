"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { authenticate, createSession, destroySession, hashPassword } from "@/lib/auth";
import { seedChartOfAccounts } from "@/lib/seed-accounts";
import { parseString } from "@/lib/utils";

export type AuthState = { error?: string };

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const orgName = parseString(formData.get("orgName"));
  const name = parseString(formData.get("name"));
  const email = parseString(formData.get("email")).toLowerCase();
  const password = parseString(formData.get("password"));

  if (!orgName || !name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  let slug = slugify(orgName);
  if (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const org = await prisma.organization.create({ data: { name: orgName, slug } });
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "OWNER",
      organizationId: org.id,
    },
  });

  await seedChartOfAccounts(org.id);

  await createSession({
    userId: user.id,
    organizationId: org.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = parseString(formData.get("email")).toLowerCase();
  const password = parseString(formData.get("password"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const session = await authenticate(email, password);
  if (!session) {
    return { error: "Invalid email or password." };
  }

  await createSession(session);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
