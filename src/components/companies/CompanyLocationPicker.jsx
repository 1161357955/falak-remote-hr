import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

function parseCoordsFromInput(value) {
  const atMatch = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = value.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  const plainMatch = value.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
  if (plainMatch) return { lat: parseFloat(plainMatch[1]), lng: parseFloat(plainMatch[2]) };
  return null;
}

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
  const [linkInput, setLinkInput] = useState("");
  const position = latitude && longitude ? [latitude, longitude] : [24.7136, 46.6753];

  const handleApplyLink = () => {
    const coords = parseCoordsFromInput(linkInput);
    if (coords) onChange(coords.lat, coords.lng);
    setLinkInput("");
  };

  return (
    <div>
      <Label>موقع المنشأة على الخريطة</Label>
      <p className="text-xs text-muted-foreground mb-1.5">اضغط على الخريطة، أو الصق رابط جوجل مابس، أو أدخل الإحداثيات يدوياً</p>

      <div className="flex items-center gap-2 mb-2">
        <Input
          placeholder="الصق رابط جوجل مابس هنا"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={handleApplyLink}>تطبيق</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <Input
          type="number"
          step="any"
          placeholder="خط العرض (Latitude)"
          value={latitude ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value), longitude)}
        />
        <Input
          type="number"
          step="any"
          placeholder="خط الطول (Longitude)"
          value={longitude ?? ""}
          onChange={(e) => onChange(latitude, e.target.value === "" ? null : parseFloat(e.target.value))}
        />
      </div>

      <div className="rounded-lg overflow-hidden border h-52">
        <MapContainer key={`${latitude}-${longitude}`} center={position} zoom={latitude ? 13 : 5} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {latitude && longitude && <Marker position={[latitude, longitude]} icon={icon} />}
          <ClickHandler onPick={(lat, lng) => onChange(lat, lng)} />
        </MapContainer>
      </div>
    </div>
  );
}