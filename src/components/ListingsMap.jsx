import React, { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { formatPrice } from '../utils/formatPrice';

// Minimum on-screen pixel distance between pins before they merge into a cluster.
const CLUSTER_RADIUS = 50;

// Zoom level at/above which a cluster that still hasn't broken apart is
// treated as geographically coincident (e.g. several units geocoded to the
// same building) rather than "just needs more zoom". Two genuinely distinct
// coordinates grow further apart in pixel space every time you zoom in, so
// if a cluster is still merged this close to max zoom, no further zooming
// will ever separate it — it needs to be fanned out ("spiderfied") into
// individually-clickable pins instead. Matches the existing zoom cap already
// used by the cluster click-to-zoom handler below.
const SPIDERFY_ZOOM = 18;

// Pixel offsets for `count` pins arranged evenly around a circle, sized so
// adjacent 36px pins don't touch (bigger counts need a wider ring).
const spiderfyRingOffsets = (count) => {
  if (count <= 1) return [{ x: 0, y: 0 }];
  const minSpacing = 44;
  const radius = Math.max(40, minSpacing / (2 * Math.sin(Math.PI / count)));
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

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

// Builds a single property pin (marker + popup). `latLng` is passed
// separately from `prop.lat`/`prop.lng` so spiderfied pins can be rendered
// at a fanned-out visual position while the popup content still reflects
// the real property data.
const createPropertyPin = (prop, latLng) => {
  const base = import.meta.env.BASE_URL;
  const label = formatPrice(prop.price, prop.currency);
  const title = prop.params?.miasto || 'Estate';
  const loc = [prop.location?.city, prop.location?.region, prop.location?.country].filter(Boolean).join(', ');
  const area = prop.params?.powierzchnia ? `${prop.params.powierzchnia} m²` : '';
  const photo = prop.params?.zdjecie1;
  const photoSrcSet = (prop.photoVariants?.zdjecie1 || [])
    .filter((variant) => variant?.url && Number(variant.width) > 0)
    .sort((left, right) => Number(left.width) - Number(right.width))
    .map((variant) => `${escapeHtml(variant.url)} ${variant.width}w`)
    .join(', ');

  const pin = L.marker(latLng, {
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
      ${photo ? `<img src="${escapeHtml(photo)}"${photoSrcSet ? ` srcset="${photoSrcSet}" sizes="200px"` : ''} alt="${escapeHtml(title)}" loading="lazy" decoding="async" style="width:100%;height:120px;object-fit:cover;border-radius:2px;display:block;margin:0 0 8px;"/>` : ''}
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#7a590c;margin:0 0 4px;">${escapeHtml(prop.tab || 'Nieruchomość')}</p>
      <h4 style="font-size:15px;font-weight:700;margin:0 0 2px;color:#1c1b1b;">${escapeHtml(title)}</h4>
      <p style="font-size:11px;color:#4e4638;margin:0 0 6px;">${escapeHtml(loc)}</p>
      ${area ? `<p style="font-size:11px;color:#807666;margin:0 0 6px;">${escapeHtml(area)}</p>` : ''}
      <div style="font-size:13px;font-weight:700;color:#7a590c;margin-bottom:8px;">${escapeHtml(label)}</div>
      <a href="${escapeHtml(`${base}property/${prop.id}`)}" style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#7a590c;font-weight:600;text-decoration:none;border-bottom:1px solid #7a590c;padding-bottom:1px;">Pokaż szczegóły →</a>
    </div>
  `, { maxWidth: 260, closeButton: true });

  return pin;
};

const ListingsMap = ({ properties = [] }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const propertiesRef = useRef(properties);

  // Reads everything through refs, so it never depends on `properties`/props
  // directly — a stable, empty-deps callback is correct and always current.
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const clusters = clusterProperties(map, propertiesRef.current);

    for (const cluster of clusters) {
      if (cluster.items.length === 1) {
        createPropertyPin(cluster.items[0], [cluster.items[0].lat, cluster.items[0].lng]).addTo(layer);
      } else if (map.getZoom() >= SPIDERFY_ZOOM) {
        // This close to max zoom, a cluster that's still merged means the
        // underlying coordinates are effectively coincident (e.g. several
        // units geocoded to the same building) rather than just needing
        // more zoom — fan the pins out into a small ring so each one is
        // still individually visible and clickable.
        const hubLatLng = map.layerPointToLatLng(cluster.point);
        const offsets = spiderfyRingOffsets(cluster.items.length);

        cluster.items.forEach((prop, i) => {
          const spiderPoint = L.point(cluster.point.x + offsets[i].x, cluster.point.y + offsets[i].y);
          const spiderLatLng = map.layerPointToLatLng(spiderPoint);

          L.polyline([hubLatLng, spiderLatLng], {
            color: '#7a590c',
            weight: 1,
            opacity: 0.5,
            interactive: false,
          }).addTo(layer);

          createPropertyPin(prop, spiderLatLng).addTo(layer);
        });
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
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37, 23],
      zoom: 5,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Re-cluster whenever the view changes — pixel distance between two fixed
    // points shifts with zoom/pan, so overlap detection must be recomputed live.
    map.on('zoomend moveend', renderMarkers);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [renderMarkers]);

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
  }, [properties, renderMarkers]);

  return <div ref={containerRef} className="listings-map w-full h-full" />;
};

export default ListingsMap;
