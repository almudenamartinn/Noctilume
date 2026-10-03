"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm() {
  const [supabase] = useState(createClient);

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || "");
        const full = (user.user_metadata && (user.user_metadata.full_name || "")) || "";
        if (full) {
          const parts = full.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        } else if (user.user_metadata && user.user_metadata.name) {
          setFirstName(user.user_metadata.name);
        }
      }
    };

    load();
  }, [supabase]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const full_name = `${firstName} ${lastName}`.trim();

    const { error } = await supabase.auth.updateUser({ data: { full_name, name: firstName } });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Profile updated.");
    setLoading(false);
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm">First name (optional)</label>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-2 rounded bg-white/5" />
      </div>

      <div>
        <label className="block text-sm">Last name (optional)</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-2 rounded bg-white/5" />
      </div>

      <div>
        <label className="block text-sm">Email</label>
        <input value={email} readOnly className="w-full p-2 rounded bg-white/10" />
      </div>

      <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 rounded-lg">
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
