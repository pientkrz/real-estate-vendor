import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { formatPrice } from '../utils/formatPrice';

const PropertiesOverviewMap = ({ properties = [] }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapInstance.current = L.map(mapContainer.current, {
      center: [47, 15],
      zoom: 4,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(mapInstance.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    properties.forEach(prop => {
      const lat = parseFloat(prop.params?.latitude);
      const lng = parseFloat(prop.params?.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const price = formatPrice(prop.price, prop.currency);
      const title = prop.params?.tytul || prop.params?.miasto || 'Luxury Estate';
      const city = prop.location?.city || '';

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:48px;height:48px;background:linear-gradient(135deg,#7a590c,#c2994a);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer;">
            <span style="color:white;font-size:8px;font-weight:700;text-align:center;padding:2px;font-family:Inter,sans-serif;line-height:1.2;">${price}</span>
          </div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          popupAnchor: [0, -28],
        }),
      });

      marker.bindPopup(`
        <div style="min-width:200px;font-family:Inter,sans-serif;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#7a590c;margin-bottom:6px;">Nieruchomość</p>
          <h4 style="font-weight:700;font-size:14px;margin-bottom:4px;font-family:'Work Sans',sans-serif;">${title}</h4>
          <p style="font-size:12px;color:#4e4638;margin-bottom:8px;">${city}</p>
          <p style="font-weight:700;color:#7a590c;font-size:14px;">${price}</p>
        </div>
      `);

      marker.addTo(mapInstance.current);
      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.3));
    }
  }, [properties]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapContainer}
        className="w-full h-full grayscale-[0.5] hover:grayscale-0 transition-all duration-1000"
      />
      {/* Left fade overlay matching the design */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(252,249,248,0.6) 0%, rgba(252,249,248,0) 20%)' }}
      />
      {/* Zoom controls overlay */}
      <div className="absolute bottom-12 right-12 flex flex-col gap-4 z-[400]">
        <div className="bg-surface/90 backdrop-blur-xl p-2 rounded-lg shadow-xl flex flex-col border border-outline-variant/10">
          <button
            className="p-3 hover:text-primary transition-colors border-b border-outline-variant/10"
            onClick={() => mapInstance.current?.zoomIn()}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <button
            className="p-3 hover:text-primary transition-colors"
            onClick={() => mapInstance.current?.zoomOut()}
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button
          className="bg-surface/90 backdrop-blur-xl p-4 rounded-lg shadow-xl text-primary border border-outline-variant/10"
          onClick={() => {
            if (markersRef.current.length > 0 && mapInstance.current) {
              const group = L.featureGroup(markersRef.current);
              mapInstance.current.fitBounds(group.getBounds().pad(0.3));
            }
          }}
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>
    </div>
  );
};

export default PropertiesOverviewMap;
