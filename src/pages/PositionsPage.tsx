import React from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { PositionList } from '../components/positions/PositionList';
import { PositionFormSection } from '../components/positions/PositionFormSection';
import { usePositions } from '../hooks/usePositions';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export function PositionsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { 
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
    handleDelete,
  } = usePositions(eventId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!event) return <ErrorMessage message="Event not found" />;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: 'Events', href: '/' },
          { label: event.name }
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{event.description}</p>
        </div>
        {isEventOwner && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Position
          </button>
        )}
      </div>

      <PositionFormSection
        isCreating={isCreating}
        editingPosition={editingPosition}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <PositionList
        positions={positions}
        onEdit={setEditingPosition}
        onDelete={handleDelete}
        isEventOwner={isEventOwner}
      />
    </div>
  );
}