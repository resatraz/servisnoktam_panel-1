import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { firestore } from './firebase';

const db = firestore;

// Şoför ekle
export const addDriver = async (driverData) => {
  const driversRef = collection(db, 'drivers');
  const newDriverRef = doc(driversRef);
  await setDoc(newDriverRef, {
    ...driverData,
    isActive: true,
    createdAt: new Date().toISOString(),
    parentCount: 0
  });
  return newDriverRef.id;
};

// Tüm şoförleri getir
export const getDrivers = async () => {
  const driversRef = collection(db, 'drivers');
  const snapshot = await getDocs(driversRef);
  const drivers = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    // schoolLocation verisini temizle
    if (data.schoolLocation && (!data.schoolLocation.latitude || !data.schoolLocation.longitude)) {
      data.schoolLocation = null;
    }
    drivers.push({
      id: doc.id,
      ...data
    });
  });
  return drivers;
};

// Tek şoför getir
export const getDriver = async (driverId) => {
  const driverRef = doc(db, 'drivers', driverId);
  const snapshot = await getDoc(driverRef);
  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  }
  return null;
};

// Şoför güncelle
export const updateDriver = async (driverId, driverData) => {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, driverData);
};

// Şoför sil
export const deleteDriver = async (driverId) => {
  const driverRef = doc(db, 'drivers', driverId);
  await deleteDoc(driverRef);
};

// Şoför konumunu dinle (real-time)
export const subscribeToDriverLocation = (driverId, callback) => {
  const locationRef = doc(db, 'drivers', driverId, 'location', 'current');
  return onSnapshot(locationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  });
};

// Veli sayısını güncelle
export const updateParentCount = async (driverId, count) => {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, { parentCount: count });
};

// Duyuru ekle
export const addAnnouncement = async (announcementData) => {
  const announcementsRef = collection(db, 'announcements');
  const newAnnouncementRef = doc(announcementsRef);
  await setDoc(newAnnouncementRef, {
    ...announcementData,
    createdAt: new Date().toISOString()
  });
  return newAnnouncementRef.id;
};

// Tüm duyuruları getir
export const getAnnouncements = async () => {
  const announcementsRef = collection(db, 'announcements');
  const snapshot = await getDocs(announcementsRef);
  const announcements = [];
  snapshot.forEach((doc) => {
    announcements.push({
      id: doc.id,
      ...doc.data()
    });
  });
  return announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Duyuru sil
export const deleteAnnouncement = async (announcementId) => {
  const announcementRef = doc(db, 'announcements', announcementId);
  await deleteDoc(announcementRef);
};

// Duyuru güncelle
export const updateAnnouncement = async (announcementId, announcementData) => {
  const announcementRef = doc(db, 'announcements', announcementId);
  await updateDoc(announcementRef, {
    ...announcementData,
    updatedAt: new Date().toISOString()
  });
};

// Okul ekle
export const addSchool = async (schoolData) => {
  const schoolsRef = collection(db, 'schools');
  const newSchoolRef = doc(schoolsRef);
  await setDoc(newSchoolRef, {
    ...schoolData,
    createdAt: new Date().toISOString()
  });
  return newSchoolRef.id;
};

// Tüm okulları getir
export const getSchools = async () => {
  const schoolsRef = collection(db, 'schools');
  const snapshot = await getDocs(schoolsRef);
  const schools = [];
  snapshot.forEach((doc) => {
    schools.push({
      id: doc.id,
      ...doc.data()
    });
  });
  return schools;
};

// Tek okul getir
export const getSchool = async (schoolId) => {
  const schoolRef = doc(db, 'schools', schoolId);
  const snapshot = await getDoc(schoolRef);
  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  }
  return null;
};

// Okul güncelle
export const updateSchool = async (schoolId, schoolData) => {
  const schoolRef = doc(db, 'schools', schoolId);
  await updateDoc(schoolRef, {
    ...schoolData,
    updatedAt: new Date().toISOString()
  });
};

// Okul sil
export const deleteSchool = async (schoolId) => {
  const schoolRef = doc(db, 'schools', schoolId);
  await deleteDoc(schoolRef);
};

export default db;
