import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Leaflet markers fix for bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const PropertyMap = ({ location = {}, city = "", params = {} }) => {
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    
    // Parse coordinates once
    const lat = parseFloat(params.latitude);
    const lng = parseFloat(params.longitude);
    const hasCoords = !isNaN(lat) && !isNaN(lng);

    useEffect(() => {
        // Only run if we have coordinates and the container is ready
        if (!hasCoords || !mapContainer.current || mapInstance.current) return;

        const coords = [lat, lng];

        // Initialize map
        try {
            mapInstance.current = L.map(mapContainer.current, {
                center: coords,
                zoom: 13,
                scrollWheelZoom: false,
                zoomControl: false
            });

            // Satellite imagery keeps the property surroundings immediately legible.
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
                maxZoom: 19
            }).addTo(mapInstance.current);

            // Add Custom Marker
            const customMarker = L.divIcon({
                className: 'custom-map-marker',
                html: `
                    <div class="relative w-12 h-12 flex items-center justify-center">
                        <div class="absolute inset-0 bg-primary opacity-20 rounded-full animate-ping"></div>
                        <div class="relative w-4 h-4 bg-primary border-2 border-surface rounded-full shadow-lg"></div>
                    </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 24]
            });

            L.marker(coords, { icon: customMarker }).addTo(mapInstance.current);

            // Add Zoom Control
            L.control.zoom({
                position: 'bottomright'
            }).addTo(mapInstance.current);

            // Force immediate resize fix
            mapInstance.current.invalidateSize();
            
            // Second resize fix after a small delay to ensure container is fully painted
            setTimeout(() => {
                if (mapInstance.current) mapInstance.current.invalidateSize();
            }, 500);

        } catch (error) {
          window.__globalSHomeReportClientError?.('error', error, {
            component: 'PropertyMap',
            operation: 'leaflet.initialization',
          });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [hasCoords, lat, lng]);

    return (
        <div className="w-full h-[300px] md:h-[500px] relative rounded-sm overflow-hidden border border-outline/5 transition-all duration-1000 group">
            {hasCoords ? (
                <div 
                    ref={mapContainer} 
                    className="w-full h-full z-0 bg-surface-container-low"
                />
            ) : (
                <div className="w-full h-full bg-surface-container-low flex flex-col items-center justify-center relative">
                    {/* Artistic Placeholder Background */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,50 Q25,0 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="0.1" />
                            <path d="M0,30 Q25,80 50,30 T100,30" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        </svg>
                    </div>
                    
                    <span className="material-symbols-outlined text-6xl text-outline/20 mb-4">location_off</span>
                    <h3 className="text-xl font-headline font-bold text-on-surface/40 uppercase tracking-widest">Lokalizacja ograniczona</h3>
                    <p className="text-[10px] font-label text-outline/60 mt-2 uppercase tracking-widest italic">Współrzędne dostępne wyłącznie w dokumentacji nieruchomości</p>
                    
                    {/* Nakładka „Lokalizacja niedostępna” */}
                    <div className="absolute inset-0 bg-obsidian/5 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                        <div className="border border-primary/20 px-12 py-4 bg-surface/80 backdrop-blur-xl">
                            <span className="text-primary font-label text-[10px] uppercase tracking-[0.5em]">Lokalizacja niedostępna</span>
                        </div>
                    </div>
                </div>
            )}
            
            {!hasCoords && (
                <div className="absolute top-8 left-8 z-[400] bg-surface/90 backdrop-blur-md p-8 shadow-2xl max-w-xs border border-outline/10">
                    <span className="text-[10px] font-label uppercase tracking-widest text-primary mb-2 block">Lokalizacja</span>
                    <h4 className="text-xl font-headline font-bold mb-4">{city || location.level4}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                        Dokładna lokalizacja jest ograniczona ze względów prywatności. Skontaktuj się z naszym doradcą, aby uzyskać informacje dotyczące dojazdu.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PropertyMap;
