import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface IndustrialTelemetry {
  machineId: string;
  machineCode: string;
  state: string;
  spindleSpeedRpm?: number;
  motorTemperatureCelsius?: number;
  vibrationMmPerSec?: number;
  cycleTimeActualSeconds?: number;
  pieceCountCurrentShift?: number;
  isSimulated: boolean;
  timestamp: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestTelemetry: Record<string, IndustrialTelemetry>;
  unreadNotificationCount: number;
  setUnreadNotificationCount: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activePlant, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestTelemetry, setLatestTelemetry] = useState<Record<string, IndustrialTelemetry>>({});
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '/';
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10
    });

    s.on('connect', () => {
      setIsConnected(true);
      if (activePlant) {
        s.emit('join_plant', activePlant._id);
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('industrial_telemetry', (data: IndustrialTelemetry) => {
      setLatestTelemetry((prev) => ({
        ...prev,
        [data.machineId]: data,
        [data.machineCode]: data
      }));
    });

    s.on('notification', () => {
      setUnreadNotificationCount((prev) => prev + 1);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && activePlant) {
      socket.emit('join_plant', activePlant._id);
    }
  }, [activePlant, isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latestTelemetry,
        unreadNotificationCount,
        setUnreadNotificationCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
