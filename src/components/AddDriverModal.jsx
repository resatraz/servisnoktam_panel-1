import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { getSchools, getDrivers } from '../firebase/firestore';
import L from 'leaflet';

// Fix for default Leaflet icons
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

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

const AddDriverModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    plate: '',
    phone: '',
    school: '',
    schoolLocation: null
  });
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [schools, setSchools] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [mapCenter, setMapCenter] = useState([37.1674, 38.7955]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        schoolLocation: initialData.schoolLocation || null
      });
      if (initialData.schoolLocation && initialData.schoolLocation.latitude && initialData.schoolLocation.longitude) {
        setSelectedLocation(initialData.schoolLocation);
      } else {
        setSelectedLocation(null);
      }
    }
  }, [initialData]);

  useEffect(() => {
    return () => {
      // Cleanup timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  useEffect(() => {
    if (showMap) {
      loadSchools();
    }
  }, [showMap]);

  const loadSchools = async () => {
    try {
      const [schoolsData, driversData] = await Promise.all([getSchools(), getDrivers()]);
      setSchools(schoolsData);
      setDrivers(driversData);
    } catch (error) {
      console.error('Okullar yüklenemedi:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSchoolChange = (e) => {
    const schoolValue = e.target.value;
    setFormData(prev => ({
      ...prev,
      school: schoolValue
    }));
    if (schoolValue && !showMap) {
      setShowMap(true);
    }
    // Okul ismi yazınca hemen geocoding yap (debounce olmadan)
    if (schoolValue && schoolValue.length > 2) {
      searchSchoolLocation(schoolValue);
    }
  };

  const searchSchoolLocation = async (schoolName) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(schoolName + ' okul Şanlıurfa')}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSelectedLocation({ latitude: lat, longitude: lng });
        setMapCenter([lat, lng]);
        setFormData(prev => ({
          ...prev,
          schoolLocation: { latitude: lat, longitude: lng }
        }));
      }
    } catch (error) {
      console.error('Okul konumu bulunamadı:', error);
    }
  };

  const handleMapClick = (latlng) => {
    setSelectedLocation({ latitude: latlng.lat, longitude: latlng.lng });
    setFormData({
      ...formData,
      schoolLocation: { latitude: latlng.lat, longitude: latlng.lng }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ name: '', plate: '', phone: '', school: '', schoolLocation: null });
    setSelectedLocation(null);
    setShowMap(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Yeni Şoför Ekle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Şoför adı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plaka *
            </label>
            <input
              type="text"
              name="plate"
              value={formData.plate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="34 ABC 123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0555 123 45 67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Okul
            </label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleSchoolChange}
              onFocus={() => {
                if (!showMap) setShowMap(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Okul Adı"
            />
            <p className="text-xs text-gray-500 mt-1">Okul adı yazınca veya tıklayınca harita açılacak</p>
          </div>

          {showMap && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Okul Konumu Seçin
              </label>
              <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} key={`${mapCenter[0]}-${mapCenter[1]}`}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {/* Mevcut Okul Marker'ları - schools koleksiyonu */}
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
                            <strong style={{ fontSize: '14px' }}>{school.name || 'Okul'}</strong>
                            <br />
                            <small style={{ color: '#666' }}>Mevcut Okul</small>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  {/* Şoförlere bağlı Okul Marker'ları */}
                  {drivers.map((driver) => {
                    if (!driver.schoolLocation || !driver.schoolLocation.latitude || !driver.schoolLocation.longitude) return null;
                    // Düzenlenen şoförün kendi konumunu tekrar gösterme
                    if (initialData && driver.id === initialData.id) return null;
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
                            <strong style={{ fontSize: '14px' }}>{driver.school || 'Okul'}</strong>
                            <br />
                            <small style={{ color: '#666' }}>{driver.name} - Okul Konumu</small>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  {/* Seçilen Konum Marker'ı */}
                  {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
                    <Marker 
                      position={[selectedLocation.latitude, selectedLocation.longitude]}
                    />
                  )}
                </MapContainer>
              </div>
              {selectedLocation && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>
                    Seçilen Konum: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDriverModal;
