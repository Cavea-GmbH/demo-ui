import type { AppConfig } from '../types/config';

/**
 * Fetch application configuration from backend
 * The backend serves config loaded from file or environment
 */
export async function fetchConfig(): Promise<AppConfig> {
  const response = await fetch('/api/config');
  
  if (!response.ok) {
    throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
  }
  
  const config = await response.json();
  return config;
}

/**
 * Validate configuration structure
 * Ensures all required fields are present
 */
export function validateConfig(config: any): config is AppConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Check floor config
  if (!config.floor || typeof config.floor.width !== 'number' || typeof config.floor.length !== 'number') {
    return false;
  }
  
  // Check zone config
  if (!config.zone || !Array.isArray(config.zone.position) || !Array.isArray(config.zone.groundControlPoints)) {
    return false;
  }
  
  // Check fences (optional but must be array)
  if (!Array.isArray(config.fences)) {
    return false;
  }
  
  // Check initialData
  if (!config.initialData || typeof config.initialData !== 'object') {
    return false;
  }
  
  return true;
}


