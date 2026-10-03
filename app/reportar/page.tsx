"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

type GeoResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

export default function ReportPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [centerKey, setCenterKey] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      }
    };

    void check();
  }, [router]);

  async function submitIncident(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!location) {
      alert("Select a location on the map.");
      return;
    }

    if (!title || !description) {
      alert("Enter a title and description.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      const res = await supabase
        .from("incidents")
        .insert({
          title,
          description,
          category,
          latitude: location.lat,
          longitude: location.lng,
          created_by: currentUser.id,
          created_by_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email,
          created_by_email: currentUser.email,
        })
        .select()
        .single();

      if (res.error) throw res.error;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("Insert with name/email failed, retrying without name/email:", message);
      try {
        const res2 = await supabase
          .from("incidents")
          .insert({
            title,
            description,
            category,
            latitude: location.lat,
            longitude: location.lng,
            created_by: currentUser.id,
          })
          .select()
          .single();

        if (res2.error) throw res2.error;
      } catch (err2) {
        const message = err2 instanceof Error ? err2.message : String(err2);
        console.error("Insert failed:", message);
        alert("Could not create the incident.");
        setLoading(false);
        return;
      }
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white px-3 py-4 sm:px-5">
      <header className="mx-auto max-w-3xl h-16 bg-white/5 border border-white/10 rounded-xl flex items-center px-5 mb-5 backdrop-blur-sm">
        <Link href="/" className="mr-4 text-xl text-white" aria-label="Back to home">
          ←
        </Link>

        <h1 className="font-bold text-white">Report an issue</h1>
      </header>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={submitIncident} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-sm">
          <div>
            <label className="block font-medium mb-2 text-gray-100">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Streetlight left on all night"
              className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block font-medium mb-2 text-gray-100">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what is happening..."
              rows={5}
              className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block font-medium mb-2 text-gray-100">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full border border-white/10 bg-gray-900/60 text-white rounded-lg p-3 outline-none focus:border-indigo-400"
            >
              <option value="street_light" className="bg-gray-900 text-white">Streetlight</option>
              <option value="building" className="bg-gray-900 text-white">Building</option>
              <option value="advertising" className="bg-gray-900 text-white">Advertising</option>
              <option value="public_lighting" className="bg-gray-900 text-white">Public lighting</option>
              <option value="private_lighting" className="bg-gray-900 text-white">Private lighting</option>
              <option value="other" className="bg-gray-900 text-white">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2 text-gray-100">Location</label>
            <p className="text-sm text-gray-300 mb-2">Click the map to mark where the incident is located.</p>

            <div className="mb-3">
              <label className="block font-medium mb-2 text-gray-100">Address (optional)</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street, city"
                  className="flex-1 border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  disabled={!address || searching}
                  onClick={async () => {
                    setSearching(true);
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
                      );
                      const data = (await res.json()) as GeoResult[];
                      setResults(data || []);

                      if (data.length > 0) {
                        const first = data[0];
                        const lat = Number.parseFloat(first.lat);
                        const lon = Number.parseFloat(first.lon);
                        setLocation({ lat, lng: lon });
                      }
                    } catch (error) {
                      console.error("Geocode failed", error);
                      alert("Could not find that address.");
                    } finally {
                      setSearching(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>

              {results.length > 0 && (
                <div className="mt-2 text-sm text-gray-200">
                  Results: {results.length} (select one to center the map)
                  <div className="mt-1 space-y-1 max-h-32 overflow-auto">
                    {results.slice(0, 5).map((result: GeoResult, index: number) => (
                      <div
                        key={`${result.lat}-${result.lon}-${index}`}
                        className="p-2 border border-white/10 rounded bg-gray-900/40 hover:bg-gray-800 cursor-pointer text-gray-100"
                        onClick={() => {
                          const lat = Number.parseFloat(result.lat);
                          const lon = Number.parseFloat(result.lon);
                          setLocation({ lat, lng: lon });
                          setAddress(result.display_name || address);
                          setResults([]);
                          setCenterKey(Date.now());
                        }}
                      >
                        {result.display_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-[320px] sm:h-[400px] rounded-xl overflow-hidden border border-white/10 mt-3 bg-black/20">
                <Map
                  incidents={[]}
                  onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                  selectedPosition={location ? [location.lat, location.lng] : null}
                  centerKey={centerKey}
                />
              </div>
            </div>

            {location && (
              <p className="text-sm mt-2 text-emerald-300">
                📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : "Submit report"}
          </button>
        </form>
      </div>
    </main>
  );
}

