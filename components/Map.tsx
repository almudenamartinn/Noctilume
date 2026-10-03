"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type MapCenterProps = {
  position?: [number, number] | null;
  centerKey?: number | null;
};

const icon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Incident = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  color?: string | null;
};

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

function MapCenter({ position, centerKey }: MapCenterProps) {
  const map = useMap();

  useEffect(() => {
    if (position && position.length === 2) {
      map.flyTo(position, 15);
    }
  }, [map, position, centerKey]);

  return null;
}

function LocationPicker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function Map({
  incidents,
  onLocationSelect,
  selectedPosition,
  centerKey,
}: {
  incidents: Incident[];
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedPosition?: [number, number] | null;
  centerKey?: number | null;
}) {
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [statusColors, setStatusColors] = useState<Record<string, string>>({});

  const handleSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    onLocationSelect?.(lat, lng);
  };


  useEffect(() => {
    const load = async () => {
      try {
        if (
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ) {
          return;
        }

        const supabase = createClient();
        const { data } = await supabase.from("status_colors").select("status,color");
        const map: Record<string, string> = {};
        (data ?? []).forEach((row: { status: string; color: string }) => {
          map[row.status] = row.color;
        });
        setStatusColors(map);
      } catch {
        // ignore
      }
    };

    void load();
  }, []);

  const visibleLocation = selectedLocation ?? selectedPosition ?? null;

  return (
    <MapContainer
      center={[40.4168, -3.7038]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onLocationSelect && (
        <LocationPicker onSelect={handleSelect} />
      )}

      {/* center map when parent requests */}
      <MapCenter position={selectedPosition ?? null} centerKey={centerKey} />

      {incidents.map((incident) => {
        const defaultColor = incident.status === "resolved" ? "#10B981" : incident.status === "reported" ? "#F59E0B" : "#EF4444";
        const color = incident.color ?? statusColors[incident.status] ?? defaultColor;

        return (
          <CircleMarker
            key={incident.id}
            center={[incident.latitude, incident.longitude]}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.9,
              weight: 1,
            }}
            radius={8}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
              {incident.title}
            </Tooltip>

            <Popup className="text-sm">
              <div className="font-semibold mb-1">{incident.title}</div>
              <div className="text-xs mb-2">{incident.description}</div>
              <div className="text-xs text-gray-600 mb-2">Status: {statusLabel(incident.status)}</div>
              {/* images removed per request */}
            </Popup>
          </CircleMarker>
        );
      })}

      {visibleLocation && onLocationSelect && (
        <Marker
          position={visibleLocation}
          icon={icon}
        >
          <Popup>
            Selected location
          </Popup>
        </Marker>
      )}

      {/* controlled by useEffect when `selectedPosition` prop changes */}
    </MapContainer>
  );
}
