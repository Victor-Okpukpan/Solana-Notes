/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { getAllUserNotes } from '@/utils/program';
import NoteCard from './NoteCard';

interface Note {
  publicKey: string;
  account: {
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
  };
}

export default function NoteList() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      loadNotes();
    }
  }, [publicKey]);

  const loadNotes = async () => {
    if (!publicKey) return;
    setLoading(true);

    try {
      const userNotes = await getAllUserNotes(connection, publicKey);
      setNotes(userNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white">
        <p>Loading notes...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-gray-400 bg-white/5 backdrop-blur-lg rounded-lg p-12">
        <p className="text-xl">No notes yet</p>
        <p className="mt-2">Create your first note to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">
        Your Notes ({notes.length})
      </h2>
      <div className="grid gap-4">
        {notes.map((note) => (
          <NoteCard
            key={note.publicKey}
            title={note.account.title}
            content={note.account.content}
            createdAt={note.account.createdAt}
            updatedAt={note.account.updatedAt}
            onDelete={loadNotes}
          />
        ))}
      </div>
    </div>
  );
}