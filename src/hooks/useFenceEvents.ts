import { useState, useEffect, useCallback, useRef } from 'react';
import type { Location, Fence, FenceEvent } from '../types/omlox';
import { getFencesContainingPoint } from '../utils/fenceDetection';

interface FenceState {
  fenceId: string;
  isInside: boolean;
}

interface UseFenceEventsReturn {
  events: FenceEvent[];
  addEvent: (event: FenceEvent) => void;
  clearEvents: () => void;
}

export function useFenceEvents(
  providerLocations: Map<string, Location>,
  trackableLocations: Map<string, Location>,
  fences: Fence[]
): UseFenceEventsReturn {
  const [events, setEvents] = useState<FenceEvent[]>([]);
  const providerFenceStatesRef = useRef<Map<string, FenceState[]>>(new Map());
  const trackableFenceStatesRef = useRef<Map<string, FenceState[]>>(new Map());

  const addEvent = useCallback((event: FenceEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 100)); // Keep last 100 events
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Check for fence events for providers
  useEffect(() => {
    const newProviderStates = new Map<string, FenceState[]>();

    providerLocations.forEach((location, providerId) => {
      const containingFences = getFencesContainingPoint(location.position, fences);
      const currentStates: FenceState[] = containingFences.map((fence) => ({
        fenceId: fence.id,
        isInside: true,
      }));

      // Check previous state
      const previousStates = providerFenceStatesRef.current.get(providerId) || [];
      const previousFenceIds = new Set(previousStates.map((s) => s.fenceId));
      const currentFenceIds = new Set(currentStates.map((s) => s.fenceId));

      // Detect entry events
      containingFences.forEach((fence) => {
        if (!previousFenceIds.has(fence.id)) {
          // Entry event
          addEvent({
            id: `${Date.now()}-${providerId}-${fence.id}-entry`,
            event_type: 'region_entry',
            fence_id: fence.id,
            provider_id: providerId,
            entry_time: new Date().toISOString(),
          });
        }
      });

      // Detect exit events
      previousStates.forEach((prevState) => {
        if (!currentFenceIds.has(prevState.fenceId) && prevState.isInside) {
          // Exit event
          addEvent({
            id: `${Date.now()}-${providerId}-${prevState.fenceId}-exit`,
            event_type: 'region_exit',
            fence_id: prevState.fenceId,
            provider_id: providerId,
            exit_time: new Date().toISOString(),
          });
        }
      });

      newProviderStates.set(providerId, currentStates);
    });

    providerFenceStatesRef.current = newProviderStates;
  }, [providerLocations, fences, addEvent]);

  // Check for fence events for trackables
  useEffect(() => {
    const newTrackableStates = new Map<string, FenceState[]>();

    trackableLocations.forEach((location, trackableId) => {
      const containingFences = getFencesContainingPoint(location.position, fences);
      const currentStates: FenceState[] = containingFences.map((fence) => ({
        fenceId: fence.id,
        isInside: true,
      }));

      // Check previous state
      const previousStates = trackableFenceStatesRef.current.get(trackableId) || [];
      const previousFenceIds = new Set(previousStates.map((s) => s.fenceId));
      const currentFenceIds = new Set(currentStates.map((s) => s.fenceId));

      // Detect entry events
      containingFences.forEach((fence) => {
        if (!previousFenceIds.has(fence.id)) {
          // Entry event
          addEvent({
            id: `${Date.now()}-${trackableId}-${fence.id}-entry`,
            event_type: 'region_entry',
            fence_id: fence.id,
            trackable_id: trackableId,
            entry_time: new Date().toISOString(),
          });
        }
      });

      // Detect exit events
      previousStates.forEach((prevState) => {
        if (!currentFenceIds.has(prevState.fenceId) && prevState.isInside) {
          // Exit event
          addEvent({
            id: `${Date.now()}-${trackableId}-${prevState.fenceId}-exit`,
            event_type: 'region_exit',
            fence_id: prevState.fenceId,
            trackable_id: trackableId,
            exit_time: new Date().toISOString(),
          });
        }
      });

      newTrackableStates.set(trackableId, currentStates);
    });

    trackableFenceStatesRef.current = newTrackableStates;
  }, [trackableLocations, fences, addEvent]);

  return {
    events,
    addEvent,
    clearEvents,
  };
}

