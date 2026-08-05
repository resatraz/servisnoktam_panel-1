import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Bell } from 'lucide-react';
import { getAnnouncements, addAnnouncement, deleteAnnouncement } from '../firebase/firestore';
import AddAnnouncementModal from '../components/AddAnnouncementModal';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
      alert('Duyurular yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (announcementData) => {
    try {
      await addAnnouncement(announcementData);
      await loadAnnouncements();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Duyuru eklenemedi:', error);
      alert('Duyuru eklenirken hata oluştu.');
    }
  };

  const handleDelete = async (announcementId) => {
    if (window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) {
      try {
        await deleteAnnouncement(announcementId);
        await loadAnnouncements();
      } catch (error) {
        console.error('Duyuru silinemedi:', error);
        alert('Duyuru silinirken hata oluştu.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Duyuru
        </button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Henüz duyuru yok</p>
          <p className="text-sm">Yeni duyuru eklemek için "Yeni Duyuru" butonunu kullanın</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(announcement.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AddAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Announcements;
