import React, { useState, useEffect } from 'react';
import { Plus, Search, Bus } from 'lucide-react';
import { getDrivers, addDriver, updateDriver, deleteDriver } from '../firebase/firestore';
import DriverCard from '../components/DriverCard';
import AddDriverModal from '../components/AddDriverModal';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.plate?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers(drivers);
    }
  }, [searchTerm, drivers]);

  const loadDrivers = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data);
      setFilteredDrivers(data);
    } catch (error) {
      console.error('Şoförler yüklenemedi:', error);
      alert('Şoförler yüklenirken hata oluştu. Firebase config güncellenmedi olabilir.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (driverData) => {
    try {
      await addDriver(driverData);
      await loadDrivers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Şoför eklenemedi:', error);
    }
  };

  const handleEditDriver = async (driverData) => {
    try {
      await updateDriver(editingDriver.id, driverData);
      await loadDrivers();
      setIsModalOpen(false);
      setEditingDriver(null);
    } catch (error) {
      console.error('Şoför güncellenemedi:', error);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (window.confirm('Bu şoförü silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDriver(driverId);
        await loadDrivers();
      } catch (error) {
        console.error('Şoför silinemedi:', error);
      }
    }
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Şoför Yönetimi</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Şoför Ekle
        </button>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Şoför adı veya plaka ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Şoför Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((driver) => (
          <DriverCard
            key={driver.id}
            driver={driver}
            onEdit={openEditModal}
            onDelete={handleDeleteDriver}
          />
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Bus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Şoför bulunamadı</p>
          <p className="text-sm">Yeni şoför eklemek için "Yeni Şoför Ekle" butonunu kullanın</p>
        </div>
      )}

      {/* Modal */}
      <AddDriverModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingDriver ? handleEditDriver : handleAddDriver}
        initialData={editingDriver}
      />
    </div>
  );
};

export default Drivers;
