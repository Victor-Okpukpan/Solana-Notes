import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import idl from './idl.json';

const PROGRAM_ID = new PublicKey('6FHDE4qJYPSstm8kvBTYBQAd3sykJV9e2K5gskNQGAQ2');

// Create a wallet interface from the signTransaction function
const createWallet = (publicKey: PublicKey, signTransaction: any, signAllTransactions: any): Wallet => {
  return {
    publicKey,
    signTransaction,
    signAllTransactions,
  } as Wallet;
};

const getProvider = (connection: Connection, publicKey: PublicKey, signTransaction: any, signAllTransactions: any) => {
  const wallet = createWallet(publicKey, signTransaction, signAllTransactions);
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
};

const getProgram = (connection: Connection, publicKey: PublicKey, signTransaction: any, signAllTransactions: any) => {
  const provider = getProvider(connection, publicKey, signTransaction, signAllTransactions);
  return new Program(idl as any, provider);
};

export const getNoteAddress = async (userPubkey: PublicKey, title: string) => {
  const [notePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('note'), userPubkey.toBuffer(), Buffer.from(title)],
    PROGRAM_ID
  );
  return notePda;
};

export const createNote = async (
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: any,
  signAllTransactions: any,
  title: string,
  content: string
) => {
  const program = getProgram(connection, publicKey, signTransaction, signAllTransactions);
  const notePda = await getNoteAddress(publicKey, title);

  const tx = await program.methods
    .createNote(title, content)
    .accounts({
      note: notePda,
      user: publicKey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = publicKey;

  const signedTx = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature);

  return signature;
};

export const updateNote = async (
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: any,
  signAllTransactions: any,
  title: string,
  newTitle: string | null,
  newContent: string | null
) => {
  const program = getProgram(connection, publicKey, signTransaction, signAllTransactions);
  const notePda = await getNoteAddress(publicKey, title);

  const tx = await program.methods
    .updateNote(newTitle, newContent)
    .accounts({
      note: notePda,
      user: publicKey,
      owner: publicKey,
    })
    .transaction();

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = publicKey;

  const signedTx = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature);

  return signature;
};

export const deleteNote = async (
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: any,
  signAllTransactions: any,
  title: string
) => {
  const program = getProgram(connection, publicKey, signTransaction, signAllTransactions);
  const notePda = await getNoteAddress(publicKey, title);

  const tx = await program.methods
    .deleteNote()
    .accounts({
      note: notePda,
      user: publicKey,
      owner: publicKey,
    })
    .transaction();

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = publicKey;

  const signedTx = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature);

  return signature;
};

export const getAllUserNotes = async (connection: Connection, userPubkey: PublicKey) => {
  // Create a read-only provider for fetching data
  const provider = new AnchorProvider(
    connection,
    {} as any,
    { commitment: 'confirmed' }
  );
  
  const program = new Program(idl as any, provider);

  // Fetch all accounts of type 'note'
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: userPubkey.toBase58(),
        },
      },
    ],
  });

  // Decode the accounts
  const notes = accounts.map((account) => {
    const decoded = program.coder.accounts.decode('note', account.account.data);
    return {
      publicKey: account.pubkey.toString(),
      account: {
        title: decoded.title,
        content: decoded.content,
        createdAt: decoded.createdAt.toNumber(),
        updatedAt: decoded.updatedAt.toNumber(),
      },
    };
  });

  return notes;
};