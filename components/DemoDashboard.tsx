"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const IncidentMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-[#10221e] text-sm text-emerald-100/70">
      Loading map...
    </div>
  ),
});

type DemoIncident = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: "reported" | "in_review" | "resolved";
  neighborhood: string;
  reported: string;
};

const initialIncidents: DemoIncident[] = [
  {
    id: "demo-1",
    title: "Floodlights aimed at nearby homes",
    description: "Three facade lights shine directly into nearby windows.",
    latitude: 40.4262,
    longitude: -3.7038,
    status: "reported",
    neighborhood: "Malasaña",
    reported: "18 min ago",
  },
  {
    id: "demo-2",
    title: "Overly bright shop sign",
    description: "The sign stays illuminated throughout the night.",
    latitude: 40.4147,
    longitude: -3.7004,
    status: "in_review",
    neighborhood: "Barrio de las Letras",
    reported: "1 hour ago",
  },
  {
    id: "demo-3",
    title: "Streetlight spilling light into the sky",
    description: "The park light has no upward shield.",
    latitude: 40.4351,
    longitude: -3.6883,
    status: "reported",
    neighborhood: "Chueca",
    reported: "3 hours ago",
  },
  {
    id: "demo-4",
    title: "Lighting improved in the plaza",
    description: "A shield was installed and the nighttime brightness reduced.",
    latitude: 40.4094,
    longitude: -3.7102,
    status: "resolved",
    neighborhood: "Lavapiés",
    reported: "Yesterday",
  },
];

const statusLabels: Record<DemoIncident["status"], string> = {
  reported: "Reported",
  in_review: "Under review",
  resolved: "Resolved",
};

const statusClasses: Record<DemoIncident["status"], string> = {
  reported: "bg-amber-300/15 text-amber-200",
  in_review: "bg-cyan-300/15 text-cyan-100",
  resolved: "bg-emerald-300/15 text-emerald-200",
};

export default function DemoDashboard() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [filter, setFilter] = useState<"all" | DemoIncident["status"]>("all");
  const [query, setQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [centerKey, setCenterKey] = useState(0);

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en");

    return incidents.filter((incident) => {
      const matchesStatus = filter === "all" || incident.status === filter;
      const matchesQuery =
        !normalizedQuery ||
        `${incident.title} ${incident.description} ${incident.neighborhood}`
          .toLocaleLowerCase("en")
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [filter, incidents, query]);

  const counts = incidents.reduce(
    (summary, incident) => {
      summary[incident.status] += 1;
      return summary;
    },
    { reported: 0, in_review: 0, resolved: 0 }
  );

  function focusIncident(incident: DemoIncident) {
    setSelectedPosition([incident.latitude, incident.longitude]);
    setCenterKey((current) => current + 1);
  }

  function changeStatus(id: string, status: DemoIncident["status"]) {
    setIncidents((current) =>
      current.map((incident) => (incident.id === id ? { ...incident, status } : incident))
    );
  }

  return (
    <main className="min-h-screen bg-[#081512] text-[#f1f5ee]">
      <header className="border-b border-white/10 bg-[#0c1c18]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200/20 bg-emerald-300/10 text-lg text-emerald-200">
              ✦
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/70">Noctilume</p>
              <h1 className="text-lg font-semibold">Light pollution reports in Madrid</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="rounded border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-xs font-medium text-amber-100">Demo mode</span>
            <span className="hidden text-sm text-white/55 sm:inline">Sample data · not saved</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8">
        <section aria-label="Incident summary" className="mb-6 grid grid-cols-2 border-y border-white/10 sm:grid-cols-4">
          <div className="border-b border-r border-white/10 py-4 pr-4 sm:border-b-0">
            <p className="text-xs uppercase tracking-wider text-white/45">Total</p>
            <p className="mt-1 text-2xl font-semibold">{incidents.length}</p>
          </div>
          <div className="border-b border-white/10 px-4 py-4 sm:border-b-0 sm:border-r">
            <p className="text-xs uppercase tracking-wider text-amber-200/70">Reported</p>
            <p className="mt-1 text-2xl font-semibold">{counts.reported}</p>
          </div>
          <div className="border-r border-white/10 py-4 pl-4 pr-4 sm:pl-5">
            <p className="text-xs uppercase tracking-wider text-cyan-100/70">Under review</p>
            <p className="mt-1 text-2xl font-semibold">{counts.in_review}</p>
          </div>
          <div className="py-4 pl-4 sm:pl-5">
            <p className="text-xs uppercase tracking-wider text-emerald-200/70">Resolved</p>
            <p className="mt-1 text-2xl font-semibold">{counts.resolved}</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#10221e]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Incident map</h2>
                <p className="mt-0.5 text-xs text-white/45">Central Madrid</p>
              </div>
              <span className="flex items-center gap-2 text-xs text-white/55"><span className="h-2 w-2 rounded-full bg-emerald-300" />Map active</span>
            </div>
            <div className="h-[420px] sm:h-[560px]">
              <IncidentMap
                incidents={incidents}
                selectedPosition={selectedPosition}
                centerKey={centerKey}
              />
            </div>
          </div>

          <aside className="min-w-0">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Incidents</h2>
                <span className="text-xs text-white/45">{filteredIncidents.length} results</span>
              </div>
              <label className="sr-only" htmlFor="demo-search">Search incidents</label>
              <input
                id="demo-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by area or description"
                className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-emerald-200/50"
              />
              <div className="flex flex-wrap gap-1.5" aria-label="Filter incidents">
                {([
                  ["all", "All"],
                  ["reported", "Reported"],
                  ["in_review", "Under review"],
                  ["resolved", "Resolved"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={`rounded px-2.5 py-1.5 text-xs transition-colors ${filter === value ? "bg-emerald-200 text-[#10221e]" : "bg-white/[0.05] text-white/65 hover:bg-white/10"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {filteredIncidents.map((incident) => (
                <article key={incident.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => focusIncident(incident)}
                    className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium leading-5">{incident.title}</h3>
                      <span className={`shrink-0 rounded px-2 py-1 text-[11px] ${statusClasses[incident.status]}`}>
                        {statusLabels[incident.status]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-white/55">{incident.description}</p>
                    <p className="mt-2 text-xs text-white/40">{incident.neighborhood} · {incident.reported}</p>
                  </button>
                  <label className="mt-3 flex items-center gap-2 text-xs text-white/45">
                    Change status
                    <select
                      value={incident.status}
                      onChange={(event) => changeStatus(incident.id, event.target.value as DemoIncident["status"])}
                      aria-label={`Change status: ${incident.title}`}
                      className="rounded border border-white/10 bg-[#10221e] px-2 py-1.5 text-xs text-white/80 outline-none focus:border-emerald-200/50"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
              {filteredIncidents.length === 0 && (
                <p className="py-8 text-center text-sm text-white/45">No matching incidents.</p>
              )}
            </div>
          </aside>
        </section>
        <p className="mt-5 text-xs text-white/35">Status changes last only while this tab remains open.</p>
      </div>
    </main>
  );
}