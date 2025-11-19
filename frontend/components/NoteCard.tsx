'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { updateNote, deleteNote } from '@/utils/program';

interface NoteCardProps {
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  onDelete: () => void;
}

export default function NoteCard({ title, content, createdAt, updatedAt, onDelete }: NoteCardProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [newContent, setNewContent] = useState(content);
  const [loading, setLoading] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleUpdate = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    setLoading(true);

    try {
      await updateNote(connection, publicKey, signTransaction, signAllTransactions, title, null, newContent);
      setIsEditing(false);
      alert('Note updated!');
      window.location.reload();
    } catch (err) {
      console.error('Error updating note:', err);
      alert('Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    setLoading(true);
    try {
      await deleteNote(connection, publicKey, signTransaction, signAllTransactions, title);
      onDelete();
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={loading}
            className="text-blue-400 hover:text-blue-300 disabled:text-gray-500"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-400 hover:text-red-300 disabled:text-gray-500"
          >
            Delete
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded text-white"
          />
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Updating...' : 'Save'}
          </button>
        </div>
      ) : (
        <p className="text-gray-300 whitespace-pre-wrap mb-4">{content}</p>
      )}

      <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-700">
        <p>Created: {formatDate(createdAt)}</p>
        {updatedAt !== createdAt && <p>Updated: {formatDate(updatedAt)}</p>}
      </div>
    </div>
  );
}