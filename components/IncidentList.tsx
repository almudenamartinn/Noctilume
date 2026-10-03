"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Incident = {
  id: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  color?: string | null;
  category?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  updated_by?: string | null;
  updated_by_name?: string | null;
  updated_by_email?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
};

type StatusColorRow = {
  status: string;
  color: string;
};

type UpdateResult = { ok: boolean; error?: string };

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Unreported",
    unreported: "Unreported",
    reported: "Reported",
    in_review: "Under review",
    resolved: "Resolved",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

export default function IncidentList({ incidents, onUpdate }: { incidents: Incident[]; onUpdate?: (id: string, status: string) => Promise<UpdateResult> }) {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Incident | null>(null);
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("unreported");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [placeFilter, setPlaceFilter] = useState<string>("");
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      try {
        const { data: statusColors } = await supabase.from("status_colors").select("status,color");
        const mapping: Record<string, string> = {};
        (statusColors ?? []).forEach((row: StatusColorRow) => {
          mapping[row.status] = row.color;
        });
        setColors(mapping);
      } catch {
        setColors({});
      }
    };

    void load();
  }, []);

  const categories = Array.from(
    new Set((incidents ?? []).map((incident) => incident.category).filter((category): category is string => Boolean(category)))
  );

  const filteredIncidents = (incidents ?? []).filter((incident) => {
    if (categoryFilter && categoryFilter !== "all" && (incident.category || "") !== categoryFilter) return false;

    if (placeFilter && placeFilter.trim() !== "") {
      const needle = placeFilter.trim().toLowerCase();
      const hay = `${incident.title || ""} ${incident.description || ""} ${incident.created_by_name || ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }

    return true;
  });

  useEffect(() => {
    const ids = Array.from(
      new Set(
        (incidents ?? [])
          .flatMap((incident) => [incident.created_by, incident.updated_by])
          .filter((value): value is string => Boolean(value))
      )
    );

    if (!ids.length) {
      return;
    }

    const loadNames = async () => {
      try {
        const supabase = createClient();
        const { data: profiles } = await supabase.from("profiles").select("id,full_name,name,email").in("id", ids);
        const next: Record<string, string> = {};

        (profiles ?? []).forEach((profile: ProfileRow) => {
          const name = profile.full_name || profile.name || profile.email;
          if (name) next[profile.id] = name;
        });

        setProfileNames(next);
      } catch {
        setProfileNames({});
      }
    };

    void loadNames();
  }, [incidents]);

  function defaultColor(status: string) {
    if (status === "resolved") return "#10B981";
    if (status === "reported") return "#F59E0B";
    return "#EF4444";
  }

  function isUuidLike(value?: string | null) {
    return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  function displayUser(value?: string | null, email?: string | null, fallback?: string | null) {
    if (value && !isUuidLike(value)) return value;
    if (email && !isUuidLike(email)) return email;
    if (fallback && !isUuidLike(fallback)) return fallback;
    return "";
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-2 items-center mb-2">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="border rounded p-2 bg-white text-black">
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <input
            placeholder="Search by location, title, or description"
            value={placeFilter}
            onChange={(event) => setPlaceFilter(event.target.value)}
            className="border rounded p-2 flex-1"
          />

          <button
            type="button"
            onClick={() => {
              setCategoryFilter("all");
              setPlaceFilter("");
            }}
            className="px-3 py-2 border rounded"
          >
            Clear
          </button>
        </div>

        {filteredIncidents.map((incident) => {
          const createdByDisplay = displayUser(
            incident.created_by_name,
            incident.created_by_email,
            profileNames[incident.created_by ?? ""] || incident.created_by
          );
          const updatedByDisplay = displayUser(
            incident.updated_by_name,
            incident.updated_by_email,
            profileNames[incident.updated_by ?? ""] || incident.updated_by
          );

          return (
            <div
              key={incident.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col gap-4 items-start hover:shadow-md"
              style={{ borderLeft: `6px solid ${incident.color ?? colors[incident.status] ?? defaultColor(incident.status)}` }}
            >
              <div className="w-full">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                  {incident.category && (
                    <span className="ml-2 text-sm px-2 py-1 rounded bg-gray-100 text-gray-900">{incident.category}</span>
                  )}
                  <span className="text-xs text-gray-700">{statusLabel(incident.status)}</span>
                </div>

                <p className="text-sm text-gray-700 mt-2">{incident.description}</p>
                {typeof incident.latitude === "number" && typeof incident.longitude === "number" && (
                  <p className="text-sm text-gray-600 mt-2">
                    📍 {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                  </p>
                )}
                {createdByDisplay && (
                  <p className="text-xs text-gray-600 mt-2">
                    Creada por: <strong className="text-gray-900">{createdByDisplay}</strong>
                  </p>
                )}
                {updatedByDisplay && (
                  <p className="text-xs text-gray-600 mt-1">
                    Last updated by: <strong className="text-gray-900">{updatedByDisplay}</strong>
                  </p>
                )}
              </div>

              <div className="w-full pt-3 border-t flex justify-end items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(incident);
                    setNewStatus(incident.status || "unreported");
                  }}
                  className="text-sm px-3 py-1 bg-indigo-100 text-gray-900 rounded"
                >
                  Change status
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 relative z-[10000]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit incident</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-500">Close</button>
            </div>

            <div>
              <div className="mb-2 font-medium text-gray-900">{selected.title}</div>
              <p className="text-sm text-gray-700 mb-4">{selected.description}</p>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  setEditing(true);

                  if (onUpdate && selected) {
                    const result = await onUpdate(selected.id, newStatus);
                    if (!result || !result.ok) {
                      const message = result?.error || "Update failed.";
                      alert(message);
                      setEditing(false);
                      return;
                    }
                  }

                  setSelected((current) => (current ? { ...current, status: newStatus } : current));
                  setEditing(false);
                  setSelected(null);
                }}
              >
                <div className="mb-3">
                  <label className="block text-sm mb-1 text-gray-900">Status</label>
                  <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} className="w-full border rounded p-2 text-gray-900">
                    <option value="unreported">Unreported</option>
                    <option value="reported">Reported</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" disabled={editing} className="px-4 py-2 bg-indigo-100 text-gray-900 rounded border">
                    {editing ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
