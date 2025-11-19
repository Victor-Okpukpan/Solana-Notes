/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { createNote } from '@/utils/program';

export default function NoteForm() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction || !signAllTransactions) return;

    setLoading(true);
    setError('');

    try {
      await createNote(connection, publicKey, signTransaction, signAllTransactions, title, content);
      setTitle('');
      setContent('');
      alert('Note created successfully!');
      window.location.reload();
    } catch (err: any) {
      console.error('Error creating note:', err);
      setError(err.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Create Note</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title (max 50 characters)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            required
            className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter note title"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/50</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Content (max 500 characters)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            required
            rows={6}
            className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter note content"
          />
          <p className="text-xs text-gray-400 mt-1">{content.length}/500</p>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !title || !content}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Creating...' : 'Create Note'}
        </button>
      </form>
    </div>
  );
}