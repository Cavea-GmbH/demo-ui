import { useState, useCallback, useEffect } from 'react';
import type {
  Location,
  LocationProvider,
  Trackable,
  Fence,
} from '../types/omlox';
import { useConfig } from '../contexts/ConfigContext';
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
  // Get configuration from context
  const { config } = useConfig();

  // Initialize empty state
  const [providers, setProviders] = useState<LocationProvider[]>([]);
  const [trackables, setTrackables] = useState<Trackable[]>([]);
  const [providerLocations, setProviderLocations] = useState<Map<string, Location>>(new Map());
  const [trackableLocations, setTrackableLocations] = useState<Map<string, Location>>(new Map());
  const [fences, setFences] = useState<Fence[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data when config becomes available
  useEffect(() => {
    if (!config || isInitialized) return;

    console.log('🎬 Loading initial data from config...');
    
    // Load fences from config
    if (config.fences && config.fences.length > 0) {
      console.log(`🚧 Loading ${config.fences.length} fence(s)`);
      setFences(config.fences);
    }

    // Load initial demo data if enabled
    if (config.initialData?.loadInitialData) {
      console.log('📦 Loading initial demo data...');
      
      // Load providers
      if (config.initialData.providers && config.initialData.providers.length > 0) {
        console.log(`👷 Loading ${config.initialData.providers.length} provider(s)`);
        setProviders(config.initialData.providers);
      }

      // Load trackables
      if (config.initialData.trackables && config.initialData.trackables.length > 0) {
        console.log(`📦 Loading ${config.initialData.trackables.length} trackable(s)`);
        setTrackables(config.initialData.trackables);
      }

      // Load initial locations
      if (config.initialData.locations) {
        const providerLocs = new Map<string, Location>();
        const trackableLocs = new Map<string, Location>();
        
        Object.entries(config.initialData.locations).forEach(([id, location]) => {
          if (id.startsWith('provider-')) {
            providerLocs.set(id, location);
          } else if (id.startsWith('trackable-')) {
            trackableLocs.set(id, location);
          }
        });

        if (providerLocs.size > 0) {
          console.log(`📍 Loading ${providerLocs.size} provider location(s)`);
          setProviderLocations(providerLocs);
        }

        if (trackableLocs.size > 0) {
          console.log(`📍 Loading ${trackableLocs.size} trackable location(s)`);
          setTrackableLocations(trackableLocs);
        }

        setLastUpdate(new Date());
      }
    }

    setIsInitialized(true);
    console.log('✅ Initial data loaded');
  }, [config, isInitialized]);

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
