import axios, { AxiosInstance } from 'axios';
import type {
  Location,
  LocationProvider,
  Trackable,
  Fence,
  TrackableMotion,
} from '../types/omlox';

const API_BASE_URL = import.meta.env.VITE_OMLOX_API_URL || 'http://127.0.0.1/v2';

class OmloxApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token if needed
    this.client.interceptors.request.use((config) => {
      const token = import.meta.env.VITE_OMLOX_AUTH_TOKEN;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Providers
  async getProviders(): Promise<LocationProvider[]> {
    const response = await this.client.get<LocationProvider[]>('/providers/summary');
    return response.data;
  }

  async getProviderById(providerId: string): Promise<LocationProvider> {
    const response = await this.client.get<LocationProvider>(`/providers/${providerId}`);
    return response.data;
  }

  async getProviderLocations(params?: {
    zone_id?: string;
    crs?: string;
    geojson?: boolean;
  }): Promise<Location[]> {
    const response = await this.client.get<Location[]>('/providers/locations', { params });
    return response.data;
  }

  async getProviderLocation(
    providerId: string,
    params?: {
      zone_id?: string;
      crs?: string;
      geojson?: boolean;
    }
  ): Promise<Location> {
    const response = await this.client.get<Location>(`/providers/${providerId}/location`, {
      params,
    });
    return response.data;
  }

  // Trackables
  async getTrackables(): Promise<Trackable[]> {
    const response = await this.client.get<Trackable[]>('/trackables/summary');
    return response.data;
  }

  async getTrackableById(trackableId: string): Promise<Trackable> {
    const response = await this.client.get<Trackable>(`/trackables/${trackableId}`);
    return response.data;
  }

  async getTrackableLocation(
    trackableId: string,
    params?: {
      zone_id?: string;
      crs?: string;
      geojson?: boolean;
    }
  ): Promise<Location> {
    const response = await this.client.get<Location>(
      `/trackables/${trackableId}/location`,
      { params }
    );
    return response.data;
  }

  async getTrackableLocations(
    trackableId: string,
    params?: {
      zone_id?: string;
      crs?: string;
      geojson?: boolean;
    }
  ): Promise<Location[]> {
    const response = await this.client.get<Location[]>(
      `/trackables/${trackableId}/locations`,
      { params }
    );
    return response.data;
  }

  async getTrackableMotions(params?: {
    zone_id?: string;
    crs?: string;
    geojson?: boolean;
  }): Promise<TrackableMotion[]> {
    const response = await this.client.get<TrackableMotion[]>('/trackables/motions', { params });
    return response.data;
  }

  // Fences
  async getFences(params?: {
    zone_id?: string;
    crs?: string;
    geojson?: boolean;
  }): Promise<Fence[]> {
    const response = await this.client.get<Fence[]>('/fences/summary', { params });
    return response.data;
  }

  async getFenceById(
    fenceId: string,
    params?: {
      zone_id?: string;
      crs?: string;
      geojson?: boolean;
    }
  ): Promise<Fence> {
    const response = await this.client.get<Fence>(`/fences/${fenceId}`, { params });
    return response.data;
  }

  // Provider CRUD operations
  async createProvider(provider: LocationProvider): Promise<LocationProvider> {
    const response = await this.client.post<LocationProvider>('/providers', provider);
    return response.data;
  }

  async updateProvider(providerId: string, provider: LocationProvider): Promise<void> {
    await this.client.put(`/providers/${providerId}`, provider);
  }

  async deleteProvider(providerId: string): Promise<void> {
    await this.client.delete(`/providers/${providerId}`);
  }

  // Trackable CRUD operations
  async createTrackable(trackable: Trackable, params?: {
    force_location_update?: boolean;
    subdivide?: boolean;
  }): Promise<Trackable> {
    const response = await this.client.post<Trackable>('/trackables', trackable, { params });
    return response.data;
  }

  async updateTrackable(trackableId: string, trackable: Trackable, params?: {
    force_location_update?: boolean;
    subdivide?: boolean;
  }): Promise<void> {
    await this.client.put(`/trackables/${trackableId}`, trackable, { params });
  }

  async deleteTrackable(trackableId: string): Promise<void> {
    await this.client.delete(`/trackables/${trackableId}`);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/providers');
      return true;
    } catch {
      return false;
    }
  }
}

export const omloxApi = new OmloxApiClient();

