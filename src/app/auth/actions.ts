"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/lib/dal/workspaces";

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || null } },
  });
  if (error) return { ok: false, error: error.message };

  // When email confirmation is enabled, no session is returned yet.
  const needsConfirmation = !data.session;
  return { ok: true, needsConfirmation };
}

// Sign up and, when a session is immediately available (email confirmation
// disabled), provision the user's first workspace with them as owner.
export async function registerWithWorkspace(formData: FormData): Promise<AuthResult> {
  const workspaceName = String(formData.get("workspace_name") ?? "").trim();
  if (!workspaceName) {
    return { ok: false, error: "Workspace name is required." };
  }

  const result = await signUp(formData);
  if (!result.ok) return result;

  // Email confirmation on → defer workspace creation until first login.
  if (result.needsConfirmation) return result;

  try {
    await createWorkspace({ name: workspaceName });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create workspace.",
    };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
