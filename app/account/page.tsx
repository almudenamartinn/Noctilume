import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProfileForm from "./ProfileForm";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/auth");
  }

  const safeUser = user as NonNullable<typeof user>;
  const name = (safeUser.user_metadata && (safeUser.user_metadata.name || safeUser.user_metadata.full_name)) || "";
  const display = name || (safeUser.email ? safeUser.email.split("@")[0] : "");

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 text-white flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 p-6 rounded-xl text-center">
        <h1 className="text-2xl font-bold mb-2">Account</h1>

        <p className="text-lg mb-1">{display}</p>
        <p className="text-sm text-gray-300 mb-4">{safeUser.email}</p>

        <div className="mb-4">
          <ProfileForm />
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <form action="/api/logout" method="post">
            <button className="px-4 py-2 bg-red-600 rounded-lg">Sign out</button>
          </form>

          <Link href="/" className="px-4 py-2 bg-indigo-600 rounded-lg">Back to map</Link>
        </div>
      </div>
    </main>
  );
}
