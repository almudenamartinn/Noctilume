import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  // On server, clear auth cookies using server createClient helper
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error(e);
  }

  return NextResponse.redirect(new URL("/auth", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
}
