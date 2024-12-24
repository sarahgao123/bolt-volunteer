import { useState, useEffect, useCallback } from 'react';
import { usePositionStore } from '../store/positionStore';
import { useEventStore } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import type { PositionWithVolunteers } from '../types/position';

export function usePositions(eventId: string | undefined) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionWithVolunteers | null>(null);
  
  const { user } = useAuthStore();
  const { 
    positions, 
    loading: positionsLoading, 
    error: positionsError, 
    fetchPositions, 
    createPosition, 
    updatePosition, 
    deletePosition 
  } = usePositionStore();
  
  const { 
    events,
    loading: eventsLoading,
    error: eventsError,
    fetchEvents
  } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (eventId) {
      fetchPositions(eventId);
    }
  }, [eventId, fetchPositions]);

  const event = events.find(e => e.id === eventId);
  const loading = positionsLoading || eventsLoading;
  const error = positionsError || eventsError;
  const isEventOwner = user?.id === event?.user_id;

  const handleCreate = useCallback(async (data: any) => {
    if (!eventId) return;
    await createPosition({ ...data, event_id: eventId });
    setIsCreating(false);
  }, [eventId, createPosition]);

  const handleUpdate = useCallback(async (data: any) => {
    if (editingPosition && isEventOwner) {
      await updatePosition(editingPosition.id, data);
      setEditingPosition(null);
    }
  }, [editingPosition, updatePosition, isEventOwner]);

  const handleDelete = useCallback(async (id: string) => {
    if (isEventOwner && window.confirm('Are you sure you want to delete this position?')) {
      await deletePosition(id);
    }
  }, [deletePosition, isEventOwner]);

  return {
    positions,
    event,
    loading,
    error,
    isCreating,
    editingPosition,
    isEventOwner,
    setIsCreating,
    setEditingPosition,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}