import React, { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';

const LiveMap = ({ driverLocations, selectedDriverId }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loadMap = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        const L = await import('leaflet');
        window.L = L.default;
        setMapLoaded(true);
      } else {
        setMapLoaded(true);
      }
    };
    loadMap();
  }, []);

  useEffect(() => {
    if (!mapLoaded || typeof window === 'undefined' || !window.L) return;

    const L = window.L;
    
    if (window.mapInstance) {
      window.mapInstance.remove();
    }

    const map = L.map('live-map', {
      center: [37.1674, 38.7955],
      zoom: 12,
      zoomControl: true
    });
    window.mapInstance = map;

    // OpenStreetMap katmanı
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Scale control ekle
    L.control.scale({ imperial: false }).addTo(map);

    // Şoför konumlarını ekle
    Object.entries(driverLocations || {}).forEach(([driverId, location]) => {
      // Seçili şoför varsa sadece onu göster
      if (selectedDriverId && selectedDriverId !== 'all' && driverId !== selectedDriverId) {
        return;
      }
      
      if (location && location.latitude && location.longitude) {
        const isActive = location.isActive !== false;
        const lastUpdate = location.timestamp ? new Date(location.timestamp) : null;
        const timeAgo = lastUpdate ? getTimeAgo(lastUpdate) : 'Bilinmiyor';

        const marker = L.marker([location.latitude, location.longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="relative">
              <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap z-10">
                ${driverId}
              </div>
              <div class="${isActive ? 'bg-primary' : 'bg-gray-400'} text-white p-2 rounded-full shadow-lg border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h-12"/><path d="M6 18v4"/><path d="M18 18v4"/>
                </svg>
              </div>
              <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 ${isActive ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white"></div>
            </div>`,
            iconSize: [40, 60],
            iconAnchor: [20, 30]
          })
        }).addTo(map);
        
        marker.bindPopup(`
          <div class="p-2">
            <div class="font-bold text-lg mb-1">Şoför ID: ${driverId}</div>
            <div class="flex items-center gap-1 text-sm ${isActive ? 'text-green-600' : 'text-gray-500'} mb-2">
              <span class="w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}"></span>
              ${isActive ? '● Aktif' : '○ Pasif'}
            </div>
            <div class="flex items-center gap-1 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Son güncelleme: ${timeAgo}
            </div>
          </div>
        `);
      }
    });

    return () => {
      if (window.mapInstance) {
        window.mapInstance.remove();
        window.mapInstance = null;
      }
    };
  }, [mapLoaded, driverLocations]);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  };

  const activeCount = Object.values(driverLocations || {}).filter(loc => loc && loc.isActive !== false).length;
  const totalCount = Object.keys(driverLocations || {}).length;

  return (
    <div className="relative" style={{ height: '68vh' }}>
      <div 
        id="live-map" 
        className="w-full h-full bg-gray-100"
      />
      {totalCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Henüz konum verisi yok</p>
            <p className="text-sm text-gray-400">Şoförler servise başladığında konumlar görünecek</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
