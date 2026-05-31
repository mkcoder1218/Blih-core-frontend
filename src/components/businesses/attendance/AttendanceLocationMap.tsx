import React from "react";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default marker assets in many bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type LatLng = { lat: number; lng: number };

export default function AttendanceLocationMap({
  center,
  radiusMeters,
  disabled,
  onChange,
}: {
  center: LatLng | null;
  radiusMeters: number;
  disabled: boolean;
  onChange: (next: LatLng) => void;
}) {
  const c = center || { lat: 0.0, lng: 0.0 };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
      <MapContainer
        center={c}
        zoom={center ? 15 : 2}
        style={{ height: 320, width: "100%" }}
        scrollWheelZoom={!disabled}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler disabled={disabled} onPick={onChange} />

        {center ? (
          <>
            <Marker
              position={center}
              draggable={!disabled}
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as any;
                  const pos = m.getLatLng();
                  onChange({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
            <Circle center={center} radius={Math.max(1, radiusMeters)} pathOptions={{ color: "#1a56db", fillColor: "#1a56db", fillOpacity: 0.08 }} />
          </>
        ) : null}
      </MapContainer>
    </div>
  );
}

function ClickHandler({ disabled, onPick }: { disabled: boolean; onPick: (p: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      if (disabled) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

