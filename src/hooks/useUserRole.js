import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * useUserRole — Reads the logged-in user's role and institution from AsyncStorage.
 * Roles: 'Alumni' | 'Admin' | 'Super Admin'
 */
export default function useUserRole() {
  const [userRole, setUserRole] = useState('Alumni');
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('AJ');
  const [userInstitution, setUserInstitution] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('userInfo');
        if (raw) {
          const info = JSON.parse(raw);
          if (info.role) setUserRole(info.role);
          if (info.institution) setUserInstitution(info.institution);
          if (info.name) {
            setUserName(info.name);
            const parts = info.name.trim().split(/\s+/);
            setUserInitials(
              parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : info.name.substring(0, 2).toUpperCase()
            );
          }
        }
      } catch (e) {
        console.log('useUserRole: failed to read userInfo', e);
      }
    };
    load();
  }, []);

  return {
    userRole,
    userName,
    userInitials,
    userInstitution,
    isAlumni: userRole === 'Alumni',
    isAdmin: userRole === 'Admin',
    isSuperAdmin: userRole === 'Super Admin',
    isAdminOrSuper: userRole === 'Admin' || userRole === 'Super Admin',
  };
}
