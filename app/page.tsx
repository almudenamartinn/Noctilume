import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IncidentsShell from "@/components/IncidentsShell";
import DemoDashboard from "@/components/DemoDashboard";

export default async function Home() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return <DemoDashboard />;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/auth");
  }

  const safeUser = user as NonNullable<typeof user>;
  const name =
    safeUser.user_metadata &&
    (safeUser.user_metadata.name || safeUser.user_metadata.full_name)
      ? safeUser.user_metadata.name || safeUser.user_metadata.full_name
      : "";

  const { data: incidents } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 text-white">
      <header className="border-b border-gray-700 bg-transparent flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 sm:h-20 z-10">
        <div>
          <h1 className="font-extrabold text-2xl tracking-tight">🌌 Noctilume</h1>
          <p className="text-sm text-gray-300 mt-1">Light pollution incident map</p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link href="/" className="px-3 py-2 rounded-md bg-white/5 text-sm">Map</Link>
          <Link href="/reportar" className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm">Report an issue</Link>
          <Link href="/account" className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 text-sm">
            <span className="font-medium">{name || safeUser.email}</span>
            <span className="hidden text-gray-300 sm:inline">{safeUser.email}</span>
          </Link>
        </nav>
      </header>

      <section className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto h-full">
          <IncidentsShell initialIncidents={incidents ?? []} />
        </div>
      </section>
    </main>
  );
}
