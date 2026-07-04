import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Label } from "@/components/ui/label";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function CompanyLocationPicker({ latitude, longitude, onChange }) {
  const position = latitude && longitude ? [latitude, longitude] : [24.7136, 46.6753];

  return (
    <div>
      <Label>موقع المنشأة على الخريطة</Label>
      <p className="text-xs text-muted-foreground mb-1.5">اضغط على الخريطة لتحديد الموقع</p>
      <div className="rounded-lg overflow-hidden border h-52">
        <MapContainer center={position} zoom={latitude ? 13 : 5} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {latitude && longitude && <Marker position={[latitude, longitude]} icon={icon} />}
          <ClickHandler onPick={(lat, lng) => onChange(lat, lng)} />
        </MapContainer>
      </div>
    </div>
  );
}