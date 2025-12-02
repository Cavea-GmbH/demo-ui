/**
 * Server-Sent Events (SSE) client to receive location updates from the proxy server
 */

import { locationPushReceiver } from './locationPushReceiver';

// Use relative URL for SSE endpoint - works in both dev and production
// Nginx proxies /events to the Node.js backend on port 3001
const SSE_ENDPOINT = '/events';

class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  connect(): void {
    if (this.eventSource) {
      console.log('🔌 Closing existing SSE connection before reconnect');
      this.eventSource.close();
      this.eventSource = null;
    }

    // Add cache-busting parameter to prevent browser from reusing stale connections
    const cacheBuster = Date.now();
    const url = `${SSE_ENDPOINT}?_t=${cacheBuster}`;
    const fullUrl = new URL(url, window.location.origin).href;
    const connectTime = new Date().toISOString();
    
    console.log(`🔌 [${connectTime}] Connecting to SSE server...`);
    console.log(`   Full URL: ${fullUrl}`);
    console.log(`   Origin: ${window.location.origin}`);
    console.log(`   Protocol: ${window.location.protocol}`);
    console.log(`   Reconnect attempt: ${this.reconnectAttempts}`);
    console.log(`   Cache buster: ${cacheBuster}`);

    try {
      // Note: withCredentials is not needed for same-origin requests (nginx proxies both frontend and backend)
      // Cookies are sent automatically for same-origin requests
      this.eventSource = new EventSource(url);
      console.log(`🔌 EventSource created, readyState: ${this.eventSource.readyState} (0=CONNECTING)`);

      this.eventSource.onopen = () => {
        const openTime = new Date().toISOString();
        console.log(`✅ [${openTime}] SSE connection opened successfully`);
        console.log(`   readyState: ${this.eventSource?.readyState} (1=OPEN)`);
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

      this.eventSource.onerror = (error: Event) => {
        const errorTime = new Date().toISOString();
        const state = this.eventSource?.readyState;
        const stateStr = state === 0 ? 'CONNECTING' : state === 1 ? 'OPEN' : 'CLOSED';
        
        console.error(`❌ [${errorTime}] SSE connection error`);
        console.error(`   readyState: ${state} (${stateStr})`);
        console.error(`   Error event:`, error);
        console.error(`   Event type: ${error.type}`);
        console.error(`   Target URL: ${(error.target as EventSource)?.url || 'unknown'}`);
        
        // Log additional details from the error event
        if (error.target) {
          const target = error.target as EventSource;
          console.error(`   EventSource URL: ${target.url}`);
          console.error(`   EventSource readyState: ${target.readyState}`);
          console.error(`   EventSource withCredentials: ${target.withCredentials}`);
        }
        
        // Attempt to reconnect on any error (CLOSED state or connection failure)
        // EventSource may stay in CONNECTING state on some failures
        if (state === EventSource.CLOSED || state === EventSource.CONNECTING) {
          this.eventSource?.close();
          this.eventSource = null;
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 3); // Exponential backoff, max 3x
            console.log(`🔄 Reconnecting in ${delay/1000}s... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
              this.connect();
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached. Please check:');
            console.error('   1. Is the proxy server running? (npm run dev:proxy)');
            console.error(`   2. Is ${SSE_ENDPOINT} accessible and proxied correctly?`);
            console.error('   3. Check browser console for CORS or network errors');
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

