/**
 * Server-Sent Events (SSE) client to receive location updates from the proxy server
 */

import { locationPushReceiver } from './locationPushReceiver';

const PROXY_SERVER_URL = import.meta.env.VITE_PROXY_SERVER_URL || 'http://localhost:3001';

class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  connect(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `${PROXY_SERVER_URL}/events`;
    console.log(`🔌 Connecting to SSE server: ${url}`);

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('✅ SSE connection opened successfully');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received SSE message:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error, event.data);
        }
      };

      this.eventSource.onerror = (error) => {
        const state = this.eventSource?.readyState;
        console.error('❌ SSE connection error. State:', state, error);
        
        if (state === EventSource.CLOSED) {
          this.eventSource?.close();
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
              this.connect();
            }, this.reconnectDelay);
          } else {
            console.error('❌ Max reconnection attempts reached. Please check:');
            console.error('   1. Is the proxy server running? (npm run dev:proxy)');
            console.error(`   2. Is it accessible at ${PROXY_SERVER_URL}?`);
            console.error('   3. Check browser console for CORS errors');
          }
        }
      };
    } catch (error) {
      console.error('❌ Failed to create EventSource:', error);
    }
  }

  private handleMessage(data: any): void {
    if (data.type === 'connected') {
      console.log('✅ Connected to proxy server');
      return;
    }

    if (data.type === 'provider_location') {
      console.log(`📍 Received provider location: ${data.providerId}`, data.location);
      locationPushReceiver.pushProviderLocation(data.providerId, data.location);
    } else if (data.type === 'trackable_location') {
      console.log(`📍 Received trackable location: ${data.trackableId}`, data.location);
      locationPushReceiver.pushTrackableLocation(data.trackableId, data.location);
    } else {
      console.warn('⚠️ Unknown message type:', data.type);
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

export const sseClient = new SSEClient();

