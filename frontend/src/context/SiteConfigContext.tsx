import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface SiteConfig {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  gstin?: string;
  currency: string;
  currencySymbol: string;
}

interface SiteConfigContextType {
  config: SiteConfig | null;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (updates: Partial<SiteConfig>) => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/site-config');
      if (response.data?.success) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to load site config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<SiteConfig>) => {
    try {
      const response = await api.put('/site-config', updates);
      if (response.data?.success) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to update site config:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const value = {
    config,
    isLoading,
    fetchConfig,
    updateConfig,
  };

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};

export default SiteConfigContext;
