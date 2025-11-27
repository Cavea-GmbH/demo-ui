import { useState, useEffect, useCallback } from 'react';
import { omloxApi } from '../services/omloxApi';
import type {
  Location,
  LocationProvider,
  Trackable,
  Fence,
} from '../types/omlox';
import { useConfig } from '../contexts/ConfigContext';

interface UseOmloxDataReturn {
  providers: LocationProvider[];
  trackables: Trackable[];
  providerLocations: Map<string, Location>;
  trackableLocations: Map<string, Location>;
  fences: Fence[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refreshLocations: () => Promise<void>;
}

export function useOmloxData(
  pollingEnabled: boolean = true,
  pollingInterval: number = 2000
): UseOmloxDataReturn {
  // Get configuration from context
  const { config } = useConfig();
  
  const [providers, setProviders] = useState<LocationProvider[]>([]);
  const [trackables, setTrackables] = useState<Trackable[]>([]);
  const [providerLocations, setProviderLocations] = useState<Map<string, Location>>(new Map());
  const [trackableLocations, setTrackableLocations] = useState<Map<string, Location>>(new Map());
  const [fences, setFences] = useState<Fence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!config) {
      console.log('⏳ Waiting for config to load...');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentConfigFences = config.fences ?? [];
      const currentZoneId = config.zone?.id ?? undefined;

      // Fetch providers, trackables, and fences in parallel
      const [providersData, trackablesData, fencesData] = await Promise.all([
        omloxApi.getProviders().catch(() => []),
        omloxApi.getTrackables().catch(() => []),
        omloxApi.getFences({ zone_id: currentZoneId, crs: 'local' }).catch(() => []),
      ]);

      setProviders(providersData);
      setTrackables(trackablesData);
      
      // Merge API fences with config fences (config fences take precedence)
      const apiFenceIds = new Set(fencesData.map(f => f.id));
      const mergedFences = [
        ...currentConfigFences,
        ...fencesData.filter(f => !apiFenceIds.has(f.id)),
      ];
      setFences(mergedFences);

      // Fetch initial locations
      await refreshLocations();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch initial data'));
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const refreshLocations = useCallback(async () => {
    if (!config) return;

    try {
      setError(null);

      const currentZoneId = config.zone?.id ?? undefined;

      // Fetch all provider locations
      const providerLocs = await omloxApi.getProviderLocations({
        zone_id: currentZoneId,
        crs: 'local',
      });

      const providerLocMap = new Map<string, Location>();
      providerLocs.forEach((loc) => {
        providerLocMap.set(loc.provider_id, loc);
      });
      setProviderLocations(providerLocMap);

      // Fetch trackable locations
      const trackableLocMap = new Map<string, Location>();
      
      // Fetch locations for each trackable
      await Promise.all(
        trackables.map(async (trackable) => {
          try {
            const location = await omloxApi.getTrackableLocation(trackable.id, {
              zone_id: currentZoneId,
              crs: 'local',
            });
            trackableLocMap.set(trackable.id, location);
          } catch (err) {
            // Trackable might not have a location yet
            console.debug(`No location for trackable ${trackable.id}`);
          }
        })
      );

      setTrackableLocations(trackableLocMap);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh locations'));
      console.error('Error refreshing locations:', err);
    }
  }, [trackables, config]);

  // Initial data load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Polling for location updates
  useEffect(() => {
    if (!pollingEnabled || isLoading) return;

    const interval = setInterval(() => {
      refreshLocations();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingEnabled, pollingInterval, isLoading, refreshLocations]);

  return {
    providers,
    trackables,
    providerLocations,
    trackableLocations,
    fences,
    isLoading,
    error,
    lastUpdate,
    refreshLocations,
  };
}

