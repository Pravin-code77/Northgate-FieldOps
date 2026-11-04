import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Network from 'expo-network';

interface ConnectivityContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  checkConnection: () => Promise<boolean>;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);

  const checkConnection = async (): Promise<boolean> => {
    try {
      const state = await Network.getNetworkStateAsync();
      const connected = state.isConnected === true;
      const reachable = state.isInternetReachable !== false;
      setIsConnected(connected);
      setIsInternetReachable(reachable);
      return connected && reachable;
    } catch {
      return isConnected;
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(() => {
      checkConnection();
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <ConnectivityContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        checkConnection,
      }}
    >
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
};
