'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import NoteList from '@/components/NoteList';
import NoteForm from '@/components/NoteForm';

export default function Home() {
  const { connected } = useWallet();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Solana Notes
          </h1>
          <p className="text-gray-300 mb-6">
            Decentralized note-taking on Solana
          </p>
          <div className="mb-6">
            <WalletMultiButton />
          </div>
        </header>

        {connected ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <NoteForm />
              </div>
              <div className="lg:col-span-2">
                <NoteList />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-300 mt-20">
            <p className="text-xl">Connect your wallet to get started</p>
          </div>
        )}
      </div>
    </main>
  );
}