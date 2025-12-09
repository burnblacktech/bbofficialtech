// =====================================================
// CA NOTES COMPONENT
// Private notes for CA (not visible to client)
// =====================================================

import React, { useState } from 'react';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '../../common/Button';
import { formatIndianDateTime } from '../../../lib/format';
import { cn } from '../../../lib/utils';

const CANotes = ({
  notes = [],
  onAdd,
  onEdit,
  onDelete,
  currentCA,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleAdd = () => {
    if (newNote.trim() && onAdd) {
      onAdd({
        text: newNote,
        createdAt: new Date().toISOString(),
        createdBy: currentCA,
      });
      setNewNote('');
      setIsAdding(false);
    }
  };

  const handleEdit = (note) => {
    if (editText.trim() && onEdit) {
      onEdit(note.id, {
        text: editText,
        updatedAt: new Date().toISOString(),
      });
      setEditingId(null);
      setEditText('');
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  return (
    <div className={cn('border border-gray-200 rounded-lg', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="text-heading-sm font-semibold text-gray-800" style={{ fontSize: '16px', fontWeight: 600 }}>
            CA Notes
          </span>
          {notes.length > 0 && (
            <span className="text-label-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 500 }}>
              {notes.length}
            </span>
          )}
        </div>
        <span className="text-label-sm text-gray-500" style={{ fontSize: '11px', fontWeight: 500 }}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* Notes List */}
          {notes.length === 0 && !isAdding && (
            <p className="text-body-md text-gray-500 text-center py-4" style={{ fontSize: '14px', lineHeight: '22px' }}>
              No notes yet. Add your first note below.
            </p>
          )}

          {notes.map((note) => (
            <div key={note.id} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-body-md focus:outline-none focus:border-gold-500"
                    style={{ fontSize: '14px', lineHeight: '22px', minHeight: '80px' }}
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleEdit(note)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-body-md text-gray-700 mb-2" style={{ fontSize: '14px', lineHeight: '22px' }}>
                    {note.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-body-sm text-gray-500" style={{ fontSize: '13px', lineHeight: '20px' }}>
                      <span>{note.createdBy?.name || 'CA'}</span>
                      <span>•</span>
                      <span>{formatIndianDateTime(note.createdAt)}</span>
                      {note.updatedAt && (
                        <>
                          <span>•</span>
                          <span>Edited</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        aria-label="Edit note"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(note.id)}
                          className="p-1 rounded hover:bg-error-50 transition-colors"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-4 h-4 text-error-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add Note */}
          {isAdding ? (
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a private note (not visible to client)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-body-md focus:outline-none focus:border-gold-500"
                style={{ fontSize: '14px', lineHeight: '22px', minHeight: '80px' }}
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" size="sm" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  Add Note
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CANotes;

