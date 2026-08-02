import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const formatPin = (price, currency) => {
  if (!price) return '?';
  const sym = currency === 'EUR' ? '€' : currency === 'PLN' ? 'zł' : currency === 'USD' ? '$' : (currency || '€');
  if (price >= 1_000_000) return `${+(price / 1_000_000).toFixed(1)}M ${sym}`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}k ${sym}`;
  return `${price} ${sym}`;
};

// Minimum on-screen pixel distance between pins before they merge into a cluster.
const CLUSTER_RADIUS = 50;

// Greedy pixel-space clustering: walks the points once, attaching each one to the
// nearest existing cluster within CLUSTER_RADIUS (updating that cluster's running
// centroid), or starting a new cluster otherwise. Recomputed on every zoom/pan since
// the pixel distance between two fixed lat/lngs changes with the map view.
const clusterProperties = (map, properties) => {
  const clusters = [];

  for (const prop of properties) {
    const lat = parseFloat(prop.params?.latitude);
    const lng = parseFloat(prop.params?.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;

    const point = map.latLngToLayerPoint([lat, lng]);

    let target = null;
    let minDist = Infinity;
    for (const cluster of clusters) {
      const d = point.distanceTo(cluster.point);
      if (d < CLUSTER_RADIUS && d < minDist) {
        minDist = d;
        target = cluster;
      }
    }

    if (target) {
      const n = target.items.length + 1;
      target.point = L.point(
        (target.point.x * (n - 1) + point.x) / n,
        (target.point.y * (n - 1) + point.y) / n
      );
      target.items.push({ ...prop, lat, lng });
    } else {
      clusters.push({ point, items: [{ ...prop, lat, lng }] });
    }
  }

  return clusters;
};

const ListingsMap = ({ properties = [] }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const propertiesRef = useRef(properties);

  const renderMarkers = () => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const base = import.meta.env.BASE_URL;
    const clusters = clusterProperties(map, propertiesRef.current);

    for (const cluster of clusters) {
      if (cluster.items.length === 1) {
        const prop = cluster.items[0];
        const label = formatPin(prop.price, prop.currency);
        const title = prop.params?.miasto || 'Estate';
        const loc = [prop.location?.city, prop.location?.region, prop.location?.country].filter(Boolean).join(', ');
        const area = prop.params?.powierzchnia ? `${prop.params.powierzchnia} m²` : '';

        const pin = L.marker([prop.lat, prop.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(252,249,248,0.95);
              border: 1px solid rgba(122,89,12,0.35);
              border-radius: 9999px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.12);
              cursor: pointer;
            "><span class="material-symbols-outlined" style="font-size:18px;color:#7a590c;">home</span></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
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

        pin.addTo(layer);
      } else {
        const count = cluster.items.length;
        const avgLat = cluster.items.reduce((sum, p) => sum + p.lat, 0) / count;
        const avgLng = cluster.items.reduce((sum, p) => sum + p.lng, 0) / count;
        const size = count < 10 ? 40 : count < 50 ? 48 : 56;

        const clusterMarker = L.marker([avgLat, avgLng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="
              width: ${size}px;
              height: ${size}px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #7a590c;
              border: 2px solid rgba(252,249,248,0.9);
              border-radius: 9999px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.25);
              color: #fcf9f8;
              font-family: 'Work Sans', sans-serif;
              font-weight: 700;
              font-size: ${count < 10 ? 14 : 16}px;
              cursor: pointer;
            ">${count}</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
          zIndexOffset: 1000,
        });

        clusterMarker.on('click', () => {
          const bounds = L.latLngBounds(cluster.items.map(p => [p.lat, p.lng]));
          if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
            map.setView(bounds.getCenter(), Math.min(map.getZoom() + 3, 18));
          } else {
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
          }
        });

        clusterMarker.addTo(layer);
      }
    }
  };

  const renderMarkersRef = useRef(renderMarkers);
  renderMarkersRef.current = renderMarkers;

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

    // Re-cluster whenever the view changes — pixel distance between two fixed
    // points shifts with zoom/pan, so overlap detection must be recomputed live.
    map.on('zoomend moveend', () => renderMarkersRef.current());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    propertiesRef.current = properties;
    if (!mapRef.current || !layerRef.current) return;

    renderMarkers();

    const bounds = properties
      .map(p => [parseFloat(p.params?.latitude), parseFloat(p.params?.longitude)])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  }, [properties]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ListingsMap;
