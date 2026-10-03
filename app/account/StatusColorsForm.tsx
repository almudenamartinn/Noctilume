"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULTS: Record<string, string> = {
  resolved: "#10B981",
  reported: "#F59E0B",
  unreported: "#EF4444",
};

export default function StatusColorsForm() {
  const [supabase] = useState(createClient);
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("status_colors").select("status,color");
        const map: Record<string, string> = { ...DEFAULTS };
        (data ?? []).forEach((row: { status: string; color: string }) => {
          map[row.status] = row.color;
        });
        setValues(map);
      } catch {
        // ignore
      }
    };

    void load();
  }, [supabase]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rows = Object.entries(values).map(([status, color]) => ({ status, color }));
      await supabase.from("status_colors").upsert(rows, { onConflict: "status" });
      alert("Colors saved.");
    } catch {
      alert("Could not save colors.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <h3 className="font-semibold">Status colors</h3>

      {Object.keys(values).map((k) => (
        <div key={k} className="flex items-center gap-3">
          <label className="w-24 text-sm">{{ unreported: "Unreported", reported: "Reported", resolved: "Resolved" }[k] || k}</label>
          <input type="color" value={values[k]} onChange={(e) => setValues({ ...values, [k]: e.target.value })} />
          <input className="flex-1 p-2 rounded bg-white/5" value={values[k]} onChange={(e) => setValues({ ...values, [k]: e.target.value })} />
        </div>
      ))}

      <button className="px-4 py-2 bg-indigo-600 rounded-lg" disabled={loading}>{loading ? "Saving..." : "Save colors"}</button>
    </form>
  );
}
