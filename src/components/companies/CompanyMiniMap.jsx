import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

export default function CompanyMiniMap({ latitude, longitude }) {
  return (
    <div className="rounded-lg overflow-hidden border h-28 mb-1.5 pointer-events-none">
      <MapContainer center={[latitude, longitude]} zoom={13} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <Marker position={[latitude, longitude]} icon={icon} />
      </MapContainer>
    </div>
  );
}