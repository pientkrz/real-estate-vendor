import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const formatPin = (price, currency) => {
  if (!price) return '?';
  const sym = currency === 'EUR' ? '€' : currency === 'PLN' ? 'zł' : currency === 'USD' ? '$' : (currency || '€');
  if (price >= 1_000_000) return `${+(price / 1_000_000).toFixed(1)}M ${sym}`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}k ${sym}`;
  return `${price} ${sym}`;
};

const ListingsMap = ({ properties = [] }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37, 23],
      zoom: 5,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    layerRef.current.clearLayers();
    const bounds = [];
    const base = import.meta.env.BASE_URL;

    for (const prop of properties) {
      const lat = parseFloat(prop.params?.latitude);
      const lng = parseFloat(prop.params?.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      bounds.push([lat, lng]);

      const label = formatPin(prop.price, prop.currency);
      const title = prop.params?.miasto || 'Estate';
      const loc = [prop.location?.city, prop.location?.region, prop.location?.country].filter(Boolean).join(', ');
      const area = prop.params?.powierzchnia ? `${prop.params.powierzchnia} m²` : '';

      const pin = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            padding: 4px 10px;
            background: rgba(252,249,248,0.95);
            border: 1px solid rgba(122,89,12,0.35);
            border-radius: 9999px;
            font-family: 'Work Sans', sans-serif;
            font-size: 11px;
            font-weight: 700;
            color: #7a590c;
            white-space: nowrap;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          ">${label}</div>`,
          iconSize: [90, 28],
          iconAnchor: [45, 14],
        }),
      });

      pin.bindPopup(`
        <div style="min-width:200px;font-family:'Work Sans',sans-serif;padding:4px;">
          <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#7a590c;margin:0 0 4px;">${prop.tab || 'Nieruchomość'}</p>
          <h4 style="font-size:15px;font-weight:700;margin:0 0 2px;color:#1c1b1b;">${title}</h4>
          <p style="font-size:11px;color:#4e4638;margin:0 0 6px;">${loc}</p>
          ${area ? `<p style="font-size:11px;color:#807666;margin:0 0 6px;">${area}</p>` : ''}
          <div style="font-size:13px;font-weight:700;color:#7a590c;margin-bottom:8px;">${label}</div>
          <a href="${base}property/${prop.id}" style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#7a590c;font-weight:600;text-decoration:none;border-bottom:1px solid #7a590c;padding-bottom:1px;">Pokaż szczegóły →</a>
        </div>
      `, { maxWidth: 260, closeButton: true });

      pin.addTo(layerRef.current);
    }

    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  }, [properties]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ListingsMap;
