import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getDrivers, subscribeToDriverLocation, getSchools } from '../firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Okul icon - Çok belirgin ve okul ismi ile
const createSchoolIcon = (schoolName) => {
  const displayName = schoolName || 'Okul';
  const shortName = displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName;
  
  return L.divIcon({
    className: 'custom-school-icon',
    html: `<div style="background: #FF5722; color: white; padding: 8px 16px; border-radius: 12px; font-weight: bold; font-size: 14px; border: 4px solid white; box-shadow: 0 6px 20px rgba(255, 87, 34, 0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 130px; min-height: 90px; text-align: center; z-index: 9999; position: relative;">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 4px;">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
      <span style="font-size: 13px; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); line-height: 1.3;">${shortName}</span>
    </div>`,
    iconSize: [150, 110],
    iconAnchor: [75, 55]
  });
};

const LiveTracking = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocations, setDriverLocations] = useState({});
  const [schools, setSchools] = useState([]);
  const unsubscribersRef = useRef([]);

  useEffect(() => {
    loadDrivers();
    return () => {
      // Cleanup subscriptions - useRef ile doğru temizlik
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, []);

  useEffect(() => {
    // Subscribe to driver locations when drivers are loaded
    if (drivers.length > 0) {
      // Önceki subscription'ları temizle
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
      
      drivers.forEach(driver => {
        const unsub = subscribeToDriverLocation(driver.id, (location) => {
          setDriverLocations(prev => ({
            ...prev,
            [driver.id]: location
          }));
        });
        unsubscribersRef.current.push(unsub);
      });
    }
    return () => {
      // drivers değiştiğinde veya unmount'ta temizle
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [drivers]);

  const loadDrivers = async () => {
    try {
      const data = await getDrivers();
      const schoolsData = await getSchools();
      setDrivers(data);
      setSchools(schoolsData);
    } catch (error) {
      console.error('Şoförler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeDrivers = drivers.filter(driver => driverLocations[driver.id] && driverLocations[driver.id].isActive);
  const displayedDrivers = selectedDriver ? drivers.filter(d => d.id === selectedDriver) : activeDrivers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Canlı Takip</h1>
        <div className="flex gap-2">
          <select
            value={selectedDriver || 'all'}
            onChange={(e) => setSelectedDriver(e.target.value === 'all' ? null : e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tüm Şoförler ({activeDrivers.length} Aktif)</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} - {driver.plate}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '600px' }}>
        <MapContainer center={[37.1674, 38.7955]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {displayedDrivers.map((driver) => {
            const location = driverLocations[driver.id];
            if (!location || !location.isActive) return null;
            
            const lat = location.lat || location.latitude;
            const lng = location.lng || location.longitude;
            
            if (!lat || !lng) return null;
            
            return (
              <Marker key={driver.id} position={[lat, lng]}>
                <Popup>
                  <div>
                    <strong>{driver.name}</strong>
                    <br />
                    {driver.plate}
                    <br />
                    <small>Son güncelleme: {location.updatedAt ? new Date(location.updatedAt.toDate ? location.updatedAt.toDate() : location.updatedAt).toLocaleString() : 'Bilinmiyor'}</small>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {/* Okul Marker'ları - schools koleksiyonu */}
          {schools.map((school) => {
            if (!school.location || !school.location.latitude || !school.location.longitude) return null;
            return (
              <Marker 
                key={school.id} 
                position={[school.location.latitude, school.location.longitude]}
                icon={createSchoolIcon(school.name)}
              >
                <Popup>
                  <div>
                    <strong style={{ fontSize: '16px' }}>{school.name || 'Okul'}</strong>
                    <br />
                    <small style={{ color: '#666' }}>Okul Konumu</small>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {/* Şoföre bağlı Okul Marker'ları - drivers.schoolLocation */}
          {drivers.filter(d => !selectedDriver || d.id === selectedDriver).map((driver) => {
            if (!driver.schoolLocation || !driver.schoolLocation.latitude || !driver.schoolLocation.longitude) return null;
            const alreadyExists = schools.some(s => s.location && Math.abs(s.location.latitude - driver.schoolLocation.latitude) < 0.0001 && Math.abs(s.location.longitude - driver.schoolLocation.longitude) < 0.0001);
            if (alreadyExists) return null;
            return (
              <Marker 
                key={`driver-school-${driver.id}`} 
                position={[driver.schoolLocation.latitude, driver.schoolLocation.longitude]}
                icon={createSchoolIcon(driver.school || driver.name)}
              >
                <Popup>
                  <div>
                    <strong style={{ fontSize: '16px' }}>{driver.school || 'Okul'}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{driver.name} - Okul Konumu</small>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Driver List */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Şoför Durumu</h2>
        <div className="space-y-2">
          {drivers.map((driver) => {
            const location = driverLocations[driver.id];
            const isActive = location && location.isActive;
            return (
              <div
                key={driver.id}
                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${selectedDriver === driver.id ? 'bg-blue-50 border-blue-300' : ''}`}
                onClick={() => setSelectedDriver(driver.id === selectedDriver ? null : driver.id)}
              >
                <div>
                  <div className="font-medium">{driver.name}</div>
                  <div className="text-sm text-gray-500">{driver.plate}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  {location && location.updatedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(location.updatedAt.toDate ? location.updatedAt.toDate() : location.updatedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
