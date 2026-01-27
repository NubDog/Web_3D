import React, { createContext, useContext, useState, useEffect } from "react";
import type { AppConfig } from "../../config/app.config";
import { getConfig } from "../../config/app.config";

const API_BASE_URL = "https://r2-api.sharkeatrice.workers.dev";

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  isLoading: boolean;
  lastUpdated: string | null;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    loadConfigFromAPI();

    const handleFocus = () => {
      loadConfigFromAPI();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadConfigFromAPI = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/config/current`);
      const result = await response.json();

      if (result.success && result.data) {
        setConfig(result.data);
        setLastUpdated(result.updated_at);
        localStorage.setItem("appConfig", JSON.stringify(result.data));
      } else {
        console.warn("Config not found in API, using default");
        const savedConfig = localStorage.getItem("appConfig");
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          setConfig({ ...getConfig(), ...parsed });
        }
      }
    } catch (err) {
      console.error("Lỗi tải config từ API:", err);
      const savedConfig = localStorage.getItem("appConfig");
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          setConfig({ ...getConfig(), ...parsed });
        } catch (parseErr) {
          console.error("Lỗi parse localStorage:", parseErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const newConfig = {
      ...config,
      ...updates,
      CONTACT: { ...config.CONTACT, ...(updates.CONTACT || {}) },
      PAYMENT: { ...config.PAYMENT, ...(updates.PAYMENT || {}) },
      VIOLATIONS: {
        ...config.VIOLATIONS,
        ...(updates.VIOLATIONS || {}),
        BLOCK_THRESHOLDS: {
          ...config.VIOLATIONS.BLOCK_THRESHOLDS,
          ...(updates.VIOLATIONS?.BLOCK_THRESHOLDS || {}),
        },
        EMAIL: {
          ...config.VIOLATIONS.EMAIL,
          ...(updates.VIOLATIONS?.EMAIL || {}),
        },
        MAINTENANCE: {
          ...config.MAINTENANCE,
          ...(updates.MAINTENANCE || {})
        },
      },
      Locations: { ...config.Locations, ...(updates.Locations || {}) },
      EMAIL: { ...config.EMAIL, ...(updates.EMAIL || {}) },
      FRONTEND: { ...config.FRONTEND, ...(updates.FRONTEND || {}) },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/config/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Lỗi lưu config");
      }

      setConfig(newConfig);
      setLastUpdated(new Date().toISOString());
      localStorage.setItem("appConfig", JSON.stringify(newConfig));
    } catch (error: any) {
      console.error("Lỗi updateConfig:", error);
      throw error;
    }
  };

  return (
    <ConfigContext.Provider
      value={{ config, updateConfig, isLoading, lastUpdated }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return context;
};
