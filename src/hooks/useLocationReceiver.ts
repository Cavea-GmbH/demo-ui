import { useState, useCallback } from 'react';
import type {
  Location,
  LocationProvider,
  Trackable,
  Fence,
} from '../types/omlox';
import { 
  HARDCODED_FENCES, 
  HARDCODED_PROVIDERS, 
  HARDCODED_TRACKABLES, 
  HARDCODED_LOCATIONS 
} from '../config/constants';
import { normalizeLocationToLocal } from '../utils/coordinateNormalize';

interface UseLocationReceiverReturn {
  providers: LocationProvider[];
  trackables: Trackable[];
  providerLocations: Map<string, Location>;
  trackableLocations: Map<string, Location>;
  fences: Fence[];
  lastUpdate: Date | null;
  // Methods to receive pushed data
  receiveProviderLocation: (providerId: string, location: Location) => void;
  receiveTrackableLocation: (trackableId: string, location: Location) => void;
  addProvider: (provider: LocationProvider) => void;
  addTrackable: (trackable: Trackable) => void;
  removeProvider: (providerId: string) => void;
  removeTrackable: (trackableId: string) => void;
}

export function useLocationReceiver(): UseLocationReceiverReturn {
  // Check if we should load initial demo data from environment variable
  const shouldLoadInitialData = import.meta.env.VITE_LOAD_INITIAL_DATA === 'true';

  // Initialize with hardcoded demo data if enabled
  const [providers, setProviders] = useState<LocationProvider[]>(
    shouldLoadInitialData ? HARDCODED_PROVIDERS : []
  );
  const [trackables, setTrackables] = useState<Trackable[]>(
    shouldLoadInitialData ? HARDCODED_TRACKABLES : []
  );
  const [providerLocations, setProviderLocations] = useState<Map<string, Location>>(() => {
    if (!shouldLoadInitialData) return new Map();
    const map = new Map<string, Location>();
    Object.entries(HARDCODED_LOCATIONS).forEach(([id, location]) => {
      if (id.startsWith('provider-')) {
        map.set(id, location);
      }
    });
    return map;
  });
  const [trackableLocations, setTrackableLocations] = useState<Map<string, Location>>(() => {
    if (!shouldLoadInitialData) return new Map();
    const map = new Map<string, Location>();
    Object.entries(HARDCODED_LOCATIONS).forEach(([id, location]) => {
      if (id.startsWith('trackable-')) {
        map.set(id, location);
      }
    });
    return map;
  });
  const [fences] = useState<Fence[]>(HARDCODED_FENCES);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(
    shouldLoadInitialData ? new Date() : null
  );

  // Receive a location update for a provider
  const receiveProviderLocation = useCallback((providerId: string, location: Location) => {
    console.log(`📍 Updating provider location: ${providerId}`, location);
    
    // Normalize location to local coordinates (convert WGS84 if needed)
    const normalizedLocation = normalizeLocationToLocal(location);
    
    // Update provider location
    setProviderLocations((prev) => {
      const newMap = new Map(prev);
      newMap.set(providerId, normalizedLocation);
      return newMap;
    });
    setLastUpdate(new Date());

    // Auto-add provider if it doesn't exist
    setProviders((prev) => {
      const exists = prev.some((p) => p.id === providerId);
      if (!exists) {
        console.log(`➕ Auto-creating provider: ${providerId}`);
        return [
          ...prev,
          {
            id: providerId,
            type: location.provider_type,
            name: location.provider_id,
          },
        ];
      }
      return prev;
    });

    // OMLOX CONCEPT: If location contains trackables array, propagate location to those trackables
    if (normalizedLocation.trackables && normalizedLocation.trackables.length > 0) {
      console.log(`🔗 Propagating provider location to trackables: ${normalizedLocation.trackables.join(', ')}`);
      
      normalizedLocation.trackables.forEach((trackableId) => {
        // Update trackable location with the provider's location (already normalized)
        setTrackableLocations((prev) => {
          const newMap = new Map(prev);
          newMap.set(trackableId, normalizedLocation);
          return newMap;
        });

        // Auto-add trackable if it doesn't exist
        setTrackables((prev) => {
          const exists = prev.some((t) => t.id === trackableId);
          if (!exists) {
            console.log(`➕ Auto-creating trackable: ${trackableId} (from provider ${providerId})`);
            return [
              ...prev,
              {
                id: trackableId,
                type: 'omlox',
                name: trackableId.slice(0, 8),
                location_providers: [providerId], // Link provider to trackable
              },
            ];
          } else {
            // Update existing trackable to include this provider if not already present
            return prev.map((t) => {
              if (t.id === trackableId) {
                const existingProviders = t.location_providers || [];
                if (!existingProviders.includes(providerId)) {
                  console.log(`🔗 Linking provider ${providerId} to trackable ${trackableId}`);
                  return {
                    ...t,
                    location_providers: [...existingProviders, providerId],
                  };
                }
              }
              return t;
            });
          }
        });
      });
    } else {
      // OMLOX CONCEPT: Also check if any trackables have this provider assigned
      // and propagate location to those trackables
      setTrackables((prev) => {
        const trackablesWithProvider = prev.filter(
          (t) => t.location_providers?.includes(providerId)
        );

        if (trackablesWithProvider.length > 0) {
          console.log(
            `🔗 Propagating provider ${providerId} location to ${trackablesWithProvider.length} trackable(s) via location_providers assignment`
          );

          trackablesWithProvider.forEach((trackable) => {
            setTrackableLocations((prevLocations) => {
              const newMap = new Map(prevLocations);
              newMap.set(trackable.id, normalizedLocation); // Use normalized location
              return newMap;
            });
          });
        }

        return prev;
      });
    }
  }, []);

  // Receive a location update for a trackable
  const receiveTrackableLocation = useCallback((trackableId: string, location: Location) => {
    console.log(`📍 Updating trackable location: ${trackableId}`, location);
    
    // Normalize location to local coordinates (convert WGS84 if needed)
    const normalizedLocation = normalizeLocationToLocal(location);
    
    setTrackableLocations((prev) => {
      const newMap = new Map(prev);
      newMap.set(trackableId, normalizedLocation);
      return newMap;
    });
    setLastUpdate(new Date());

    // Auto-add trackable if it doesn't exist
    setTrackables((prev) => {
      const exists = prev.some((t) => t.id === trackableId);
      if (!exists) {
        console.log(`➕ Auto-creating trackable: ${trackableId}`);
        return [
          ...prev,
          {
            id: trackableId,
            type: 'omlox',
            name: trackableId.slice(0, 8),
            // If location has provider_id, link it
            location_providers: location.provider_id ? [location.provider_id] : undefined,
          },
        ];
      }
      return prev;
    });
  }, []);

  // Manually add a provider (or update if exists)
  const addProvider = useCallback((provider: LocationProvider) => {
    setProviders((prev) => {
      const exists = prev.some((p) => p.id === provider.id);
      if (exists) {
        // Update existing provider
        return prev.map((p) => (p.id === provider.id ? provider : p));
      }
      return [...prev, provider];
    });
  }, []);

  // Manually add a trackable (or update if exists)
  const addTrackable = useCallback((trackable: Trackable) => {
    setTrackables((prev) => {
      const exists = prev.some((t) => t.id === trackable.id);
      if (exists) {
        // Update existing trackable
        return prev.map((t) => (t.id === trackable.id ? trackable : t));
      }
      return [...prev, trackable];
    });
  }, []);

  // Remove a provider
  const removeProvider = useCallback((providerId: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== providerId));
    setProviderLocations((prev) => {
      const newMap = new Map(prev);
      newMap.delete(providerId);
      return newMap;
    });
  }, []);

  // Remove a trackable
  const removeTrackable = useCallback((trackableId: string) => {
    setTrackables((prev) => prev.filter((t) => t.id !== trackableId));
    setTrackableLocations((prev) => {
      const newMap = new Map(prev);
      newMap.delete(trackableId);
      return newMap;
    });
  }, []);

  return {
    providers,
    trackables,
    providerLocations,
    trackableLocations,
    fences,
    lastUpdate,
    receiveProviderLocation,
    receiveTrackableLocation,
    addProvider,
    addTrackable,
    removeProvider,
    removeTrackable,
  };
}
