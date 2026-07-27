import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
};

function sessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters. " +
        "Generate one with: openssl rand -hex 32",
    );
  }
  return secret;
}

export const sessionOptions: SessionOptions = {
  cookieName: "cloze_session",
  // Validated lazily on access so `next build` (which has no secret) never
  // triggers it; the check runs when a session is actually read or written.
  get password() {
    return sessionPassword();
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session.userId ?? null;
}
