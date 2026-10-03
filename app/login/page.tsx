"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 px-4">
      <form
        onSubmit={login}
        className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-lg"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            🌌 Noctilume
          </h1>

          <p className="text-gray-300 mt-1">
            Member sign in
          </p>
        </div>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-3 transition"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-sm text-center text-gray-300">
          Don&apos;t have an account? <a href="/register" className="underline text-indigo-300">Sign up</a>
        </p>
      </form>
    </main>
  );
}


