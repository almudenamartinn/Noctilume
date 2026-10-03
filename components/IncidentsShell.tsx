"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import IncidentList from "./IncidentList";

const Map = dynamic(() => import("./Map"), { ssr: false });

type AppUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    name?: string | null;
    full_name?: string | null;
  } | null;
};

type IncidentRecord = {
  id: string;
  title: string;
  description: string;
  status: string;
  color?: string | null;
  category?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  updated_by?: string | null;
  updated_by_name?: string | null;
  updated_by_email?: string | null;
  latitude: number;
  longitude: number;
};

type MapIncident = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  color?: string | null;
};

type LocalUpdaterPayload = {
  updated_by?: string;
  updated_by_email?: string;
  updated_by_name?: string;
};

export default function IncidentsShell({ initialIncidents }: { initialIncidents: IncidentRecord[] }) {
  const [supabase] = useState(createClient);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(initialIncidents || []);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setCurrentUser((data.user as AppUser | null) ?? null);
      } catch {
        setCurrentUser(null);
      }
    };

    void loadUser();
  }, [supabase]);

  const LS_KEY = "local_incident_updaters_v1";

  function loadLocalUpdaters(): Record<string, LocalUpdaterPayload> {
    try {
      if (typeof window === "undefined") return {};
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      return JSON.parse(raw || "{}") as Record<string, LocalUpdaterPayload>;
    } catch {
      return {};
    }
  }

  function saveLocalUpdater(id: string, payload: LocalUpdaterPayload) {
    try {
      if (typeof window === "undefined") return;
      const map = loadLocalUpdaters();
      map[id] = { ...map[id], ...payload };
      localStorage.setItem(LS_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!currentUser) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIncidents((prev) => {
      const arr = prev ?? [];
      let changed = false;
      const name = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email || "";

      const next = arr.map((item) => {
        let updated = item;
        if (item.created_by === currentUser.id && item.created_by_name !== name) {
          updated = { ...updated, created_by_name: name };
          changed = true;
        }
        if (item.updated_by === currentUser.id && item.updated_by_name !== name) {
          updated = { ...updated, updated_by_name: name };
          changed = true;
        }
        return updated;
      });

      return changed ? next : prev;
    });
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIncidents((prev) => {
      const arr = prev ?? [];
      const needs = arr.some((item) => item.status === "pending");
      if (!needs) return prev;
      return arr.map((item) => ({
        ...item,
        status: item.status === "pending" ? "unreported" : item.status || "unreported",
      }));
    });
  }, []);

  useEffect(() => {
    try {
      const map = loadLocalUpdaters();
      if (!map || Object.keys(map).length === 0) return;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncidents((prev) => {
        const arr = prev ?? [];
        let changed = false;
        const next = arr.map((item) => {
          const local = map[item.id];
          if (local && !item.updated_by_name) {
            changed = true;
            return {
              ...item,
              updated_by: local.updated_by || item.updated_by,
              updated_by_email: local.updated_by_email || item.updated_by_email,
              updated_by_name: local.updated_by_name || item.updated_by_name,
            };
          }
          return item;
        });
        return changed ? next : prev;
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const resolveNames = async () => {
      try {
        const ids = new Set<string>();
        incidents.forEach((incident) => {
          if (incident.created_by) ids.add(incident.created_by);
          if (incident.updated_by) ids.add(incident.updated_by);
        });

        if (ids.size === 0) return;

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,full_name,name,email")
          .in("id", Array.from(ids));

        if (!profiles) return;

        const profileMap: Record<string, { id: string; full_name?: string | null; name?: string | null; email?: string | null }> = {};
        profiles.forEach((profile) => {
          profileMap[profile.id] = profile;
        });

        let changed = false;
        const nextIncidents = incidents.map((incident) => {
          const createdProfile = profileMap[incident.created_by ?? ""];
          const updatedProfile = profileMap[incident.updated_by ?? ""];
          const createdName =
            createdProfile?.full_name ||
            createdProfile?.name ||
            createdProfile?.email ||
            (incident.created_by_name && !/^([0-9a-f-]{36}|[0-9a-f-]{32})$/i.test(incident.created_by_name)
              ? incident.created_by_name
              : incident.created_by_email || incident.created_by_name || incident.created_by);
          const updatedName =
            updatedProfile?.full_name ||
            updatedProfile?.name ||
            updatedProfile?.email ||
            (incident.updated_by_name && !/^([0-9a-f-]{36}|[0-9a-f-]{32})$/i.test(incident.updated_by_name)
              ? incident.updated_by_name
              : incident.updated_by_email || incident.updated_by_name || incident.updated_by);

          if (createdName !== incident.created_by_name || updatedName !== incident.updated_by_name) {
            changed = true;
            return { ...incident, created_by_name: createdName, updated_by_name: updatedName };
          }

          return incident;
        });

        if (changed) setIncidents(nextIncidents);
      } catch {
        // ignore if profiles table doesn't exist
      }
    };

    void resolveNames();
  }, [incidents, supabase]);

  const handleUpdate = async (id: string, status: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const user = currentUser
        ? {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email,
          }
        : null;

      const res = await fetch("/api/incidents/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok || data?.error) {
        const message = data?.error || `HTTP ${res.status}`;
        console.error("Update failed:", message);
        return { ok: false, error: message };
      }

      const color = status === "resolved" ? "#10B981" : status === "reported" ? "#F59E0B" : "#EF4444";
      setIncidents((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          const next: IncidentRecord = { ...item, status, color };

          if (user && user.id) next.updated_by = user.id;
          if (user && user.email) next.updated_by_email = user.email ?? null;
          if (user && user.name) next.updated_by_name = user.name ?? null;

          return next;
        })
      );

      if (user && user.id) {
        saveLocalUpdater(id, {
          updated_by: user.id,
          updated_by_email: user.email ?? undefined,
          updated_by_name: user.name ?? undefined,
        });
      }

      return { ok: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Update exception:", message);
      return { ok: false, error: message };
    }
  };

  const mapIncidents: MapIncident[] = incidents.filter(
    (item): item is MapIncident =>
      Boolean(item.id) &&
      typeof item.title === "string" &&
      typeof item.description === "string" &&
      typeof item.status === "string" &&
      typeof item.latitude === "number" &&
      typeof item.longitude === "number"
  );

  const total = incidents.length;
  const counts = incidents.reduce<Record<string, number>>((acc, incident) => {
    const key = incident.status === "pending" ? "unreported" : (incident.status ?? "unreported");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const unreported = counts["unreported"] || 0;
  const reported = counts["reported"] || 0;
  const resolved = counts["resolved"] || 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <aside className="lg:col-span-1 bg-white/5 rounded-xl p-4 shadow-inner backdrop-blur sm:p-6">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="mt-4 text-3xl font-extrabold text-white">{total}</p>
        <div className="mt-2 text-sm text-gray-300 space-y-1">
          <div>Unreported: <strong>{unreported}</strong></div>
          <div>Reported to the city: <strong>{reported}</strong></div>
          <div>Resolved: <strong>{resolved}</strong></div>
        </div>

        <div className="mt-6 text-sm text-gray-300">
          <strong className="block">Updating incidents</strong>
          <p className="mt-2">Select <strong>Change status</strong> to update an incident.</p>

          <div className="mt-3">
            <strong className="block">Reporting an issue</strong>
            <p className="mt-2">Select <strong>Report an issue</strong> to add a new incident.</p>
            <div className="mt-3">
              <strong className="block">Status colors</strong>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#EF4444" }} />
                  <span className="text-sm text-gray-300">Unreported</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#F59E0B" }} />
                  <span className="text-sm text-gray-300">Reported</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#10B981" }} />
                  <span className="text-sm text-gray-300">Resolved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:col-span-2 bg-white/5 rounded-xl overflow-hidden shadow-lg p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-[42vh] sm:h-[50vh] lg:h-[60vh]">
            <Map incidents={mapIncidents} />
          </div>

          <div className="overflow-y-auto max-h-[42vh] sm:max-h-[50vh] lg:max-h-[60vh] p-2">
            <IncidentList incidents={incidents} onUpdate={handleUpdate} />
          </div>
        </div>
      </main>
    </div>
  );
}
