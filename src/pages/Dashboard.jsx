import React, { useState, useEffect, useRef } from 'react';
import { Bus, Users, MapPin, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import LiveMap from '../components/LiveMap';
import { getDrivers, subscribeToDriverLocation } from '../firebase/firestore';

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
      setDrivers(drivers);
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
        <LiveMap driverLocations={driverLocations} selectedDriverId={selectedDriverId} />
      </div>
    </div>
  );
};

export default Dashboard;
