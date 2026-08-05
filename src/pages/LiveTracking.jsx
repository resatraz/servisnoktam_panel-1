import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getDrivers, subscribeToDriverLocation } from '../firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveTracking = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocations, setDriverLocations] = useState({});
  const [unsubscribers, setUnsubscribers] = useState([]);

  useEffect(() => {
    loadDrivers();
    return () => {
      // Cleanup subscriptions
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    // Subscribe to driver locations when drivers are loaded
    if (drivers.length > 0) {
      const newUnsubscribers = [];
      
      drivers.forEach(driver => {
        const unsub = subscribeToDriverLocation(driver.id, (location) => {
          setDriverLocations(prev => ({
            ...prev,
            [driver.id]: location
          }));
        });
        newUnsubscribers.push(unsub);
      });
      
      setUnsubscribers(newUnsubscribers);
    }
  }, [drivers]);

  const loadDrivers = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data);
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
        <MapContainer center={[39.9334, 32.8597]} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {displayedDrivers.map((driver) => {
            const location = driverLocations[driver.id];
            if (!location || !location.isActive) return null;
            
            return (
              <Marker key={driver.id} position={[location.lat, location.lng]}>
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
