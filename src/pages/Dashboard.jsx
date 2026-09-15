import React, { useState, useEffect, useRef } from 'react';
import { Bus, Users, MapPin, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
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

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalParents: 0,
    activeDrivers: 0,
    totalRoutes: 0
  });
  const [driverLocations, setDriverLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('all');
  const unsubscribersRef = useRef([]);

  useEffect(() => {
    loadStats();
    return () => {
      // Cleanup subscriptions
      unsubscribersRef.current.forEach(unsub => unsub());
    };
  }, []);

  const loadStats = async () => {
    try {
      const drivers = await getDrivers();
      const schools = await getSchools();
      setDrivers(drivers);
      setSchools(schools);
      const totalParents = drivers.reduce((sum, driver) => sum + (driver.parentCount || 0), 0);
      
      setStats({
        totalDrivers: drivers.length,
        totalParents,
        activeDrivers: drivers.filter(d => d.isActive !== false).length,
        totalRoutes: drivers.filter(d => d.route).length
      });

      // Driver listesi yüklendikten sonra konumları dinle
      loadDriverLocations(drivers);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
      setStats({
        totalDrivers: 0,
        totalParents: 0,
        activeDrivers: 0,
        totalRoutes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDriverLocations = (driversList) => {
    // Önceki subscription'ları temizle
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Tüm şoförlerin konumlarını dinle
    driversList.forEach(driver => {
      const unsubscribe = subscribeToDriverLocation(driver.id, (location) => {
        setDriverLocations(prev => ({
          ...prev,
          [driver.id]: location
        }));
      });
      unsubscribersRef.current.push(unsubscribe);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Şoför"
          value={stats.totalDrivers}
          icon={Bus}
          color="primary"
        />
        <StatCard
          title="Toplam Veli"
          value={stats.totalParents}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Aktif Şoför"
          value={stats.activeDrivers}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Güzergah Sayısı"
          value={stats.totalRoutes}
          icon={MapPin}
          color="orange"
        />
      </div>

      {/* Canlı Harita */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Bus className="w-5 h-5 mr-2 text-primary" />
            Canlı Konum Takibi
          </h3>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">Tüm Şoförler</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.name} ({driver.plate})
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '730px' }}>
          <MapContainer center={[37.1674, 38.7955]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {Object.entries(driverLocations || {}).map(([driverId, location]) => {
              // Seçili şoför varsa sadece onu göster
              if (selectedDriverId && selectedDriverId !== 'all' && driverId !== selectedDriverId) {
                return null;
              }
              
              if (!location || !location.isActive) return null;
              
              const driver = drivers.find(d => d.id === driverId);
              if (!driver) return null;
              
              const lat = location.lat || location.latitude;
              const lng = location.lng || location.longitude;
              
              if (!lat || !lng) return null;
              
              return (
                <Marker key={driverId} position={[lat, lng]}>
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
            {drivers.map((driver) => {
              if (selectedDriverId !== 'all' && driver.id !== selectedDriverId) return null;
              if (!driver.schoolLocation || !driver.schoolLocation.latitude || !driver.schoolLocation.longitude) return null;
              // Aynı koordinatta zaten schools varsa tekrar ekleme
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
      </div>
    </div>
  );
};

export default Dashboard;
