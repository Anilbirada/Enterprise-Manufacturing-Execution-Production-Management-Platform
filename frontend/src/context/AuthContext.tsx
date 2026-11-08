import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Plant } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  activePlant: Plant | null;
  plants: Plant[];
  isLoading: boolean;
  setupRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectPlant: (plant: Plant) => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rsr_auth_token'));
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activePlant, setActivePlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);

  const checkSetup = async () => {
    try {
      const res = await api.request('/auth/setup-status');
      if (res.setupRequired) {
        setSetupRequired(true);
      }
    } catch (err) {
      console.error('Failed to check setup status:', err);
    }
  };

  const loadPlants = async () => {
    try {
      const res = await api.request('/master-data/plants');
      if (res.success && res.list.length > 0) {
        setPlants(res.list);
        const storedPlantId = api.getPlantId();
        const found = res.list.find((p: Plant) => p._id === storedPlantId) || res.list[0];
        setActivePlant(found);
        api.setPlantId(found._id);
      }
    } catch (err) {
      console.error('Failed to load plants:', err);
    }
  };

  const refreshUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.request('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        await loadPlants();
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSetup().then(() => {
      if (token) refreshUser();
      else setIsLoading(false);
    });
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success && res.token) {
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      await loadPlants();
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('rsr_auth_token');
  };

  const selectPlant = (plant: Plant) => {
    setActivePlant(plant);
    api.setPlantId(plant._id);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'System Administrator') return true;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activePlant,
        plants,
        isLoading,
        setupRequired,
        login,
        logout,
        selectPlant,
        hasPermission,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
