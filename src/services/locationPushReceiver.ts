/**
 * Location Push Receiver Service
 * 
 * This service provides a way to receive location updates that are pushed to the app.
 * It exposes a global function that can be called from outside (e.g., from a backend proxy
 * or WebSocket handler) to push location data to the app.
 */

type LocationUpdateCallback = (providerId: string, location: any) => void;
type TrackableLocationUpdateCallback = (trackableId: string, location: any) => void;

class LocationPushReceiver {
  private providerLocationCallbacks: Set<LocationUpdateCallback> = new Set();
  private trackableLocationCallbacks: Set<TrackableLocationUpdateCallback> = new Set();

  /**
   * Register a callback to receive provider location updates
   */
  onProviderLocationUpdate(callback: LocationUpdateCallback): () => void {
    this.providerLocationCallbacks.add(callback);
    return () => {
      this.providerLocationCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback to receive trackable location updates
   */
  onTrackableLocationUpdate(callback: TrackableLocationUpdateCallback): () => void {
    this.trackableLocationCallbacks.add(callback);
    return () => {
      this.trackableLocationCallbacks.delete(callback);
    };
  }

  /**
   * Push a provider location update
   * This can be called from outside the app (e.g., from a backend proxy)
   */
  pushProviderLocation(providerId: string, location: any): void {
    this.providerLocationCallbacks.forEach((callback) => {
      try {
        callback(providerId, location);
      } catch (error) {
        console.error('Error in provider location callback:', error);
      }
    });
  }

  /**
   * Push a trackable location update
   * This can be called from outside the app (e.g., from a backend proxy)
   */
  pushTrackableLocation(trackableId: string, location: any): void {
    this.trackableLocationCallbacks.forEach((callback) => {
      try {
        callback(trackableId, location);
      } catch (error) {
        console.error('Error in trackable location callback:', error);
      }
    });
  }
}

export const locationPushReceiver = new LocationPushReceiver();

// Expose globally for external access (e.g., from a backend proxy)
if (typeof window !== 'undefined') {
  (window as any).pushProviderLocation = (providerId: string, location: any) => {
    locationPushReceiver.pushProviderLocation(providerId, location);
  };
  
  (window as any).pushTrackableLocation = (trackableId: string, location: any) => {
    locationPushReceiver.pushTrackableLocation(trackableId, location);
  };
}

