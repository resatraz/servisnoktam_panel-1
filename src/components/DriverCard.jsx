import React from 'react';
import { Bus, Users, MapPin, MoreVertical, Trash2 } from 'lucide-react';

const DriverCard = ({ driver, onEdit, onDelete }) => {
  // Baş harf avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar - Baş harf */}
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
            {getInitial(driver.name)}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{driver.name}</h3>
            <p className="text-sm text-gray-600">{driver.plate || 'Plaka yok'}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{driver.parentCount || 0} Veli</span>
              </div>
              {driver.route && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{driver.route}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(driver)}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
            title="Düzenle"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(driver.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sil"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {driver.phone && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Telefon:</span> {driver.phone}
          </p>
        </div>
      )}
    </div>
  );
};

export default DriverCard;
