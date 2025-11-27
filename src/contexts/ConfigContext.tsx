import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppConfig } from '../types/config';
import { fetchConfig, validateConfig } from '../services/configService';

interface ConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Loading runtime configuration...');
      const fetchedConfig = await fetchConfig();
      
      if (!validateConfig(fetchedConfig)) {
        throw new Error('Invalid configuration structure received from server');
      }
      
      console.log('✅ Configuration loaded successfully');
      console.log('📐 Floor:', fetchedConfig.floor.width, 'x', fetchedConfig.floor.length, 'meters');
      console.log('📍 GCPs:', fetchedConfig.zone.groundControlPoints.length, 'points');
      console.log('🚧 Fences:', fetchedConfig.fences.length);
      console.log('🎬 Initial data:', fetchedConfig.initialData.loadInitialData ? 'enabled' : 'disabled');
      
      setConfig(fetchedConfig);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error loading configuration');
      console.error('❌ Failed to load configuration:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const reload = async () => {
    await loadConfig();
  };

  return (
    <ConfigContext.Provider value={{ config, isLoading, error, reload }}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook to access configuration in components
 * Throws error if used outside ConfigProvider
 */
export function useConfig(): ConfigContextType {
  const context = useContext(ConfigContext);
  
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  
  return context;
}

