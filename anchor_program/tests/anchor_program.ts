import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaNotes } from "../target/types/solana_notes";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as assert from "assert";

describe("anchor_program", () => {
  // Configure the client to use the local validator spawned by `anchor test`.
  anchor.setProvider(anchor.AnchorProvider.local());

  const program = anchor.workspace.solana_notes as Program<SolanaNotes>;

  // Test helpers / shared state
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  let user: anchor.web3.Keypair;
  const title = "My first note";
  const content = "This is the note content";
  const newContent = "This is the updated content";
  let notePda: PublicKey;
  let bump: number;

  before(async () => {
    // create a test user and fund it
    user = anchor.web3.Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      user.publicKey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    // compute PDA for the note we'll create in tests
    [notePda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("note"), user.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );
  });

  // No `initialize` instruction in this program's IDL, skip initialize test.

  it("Create note (happy path)", async () => {
    await program.methods
      .createNote(title, content)
      .accounts({
        note: notePda,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const noteAccount = await program.account.note.fetch(notePda);

    assert.equal(noteAccount.title, title);
    assert.equal(noteAccount.content, content);
    assert.equal(noteAccount.owner.toBase58(), user.publicKey.toBase58());
    assert.equal(noteAccount.bump, bump);
  });

  it("Create note — fails when title is too long", async () => {
    const longTitle = "a".repeat(51);

    // Deriving a PDA with a seed > 32 bytes will fail client-side; assert that.
    assert.throws(() => {
      PublicKey.findProgramAddressSync(
        [Buffer.from("note"), user.publicKey.toBuffer(), Buffer.from(longTitle)],
        program.programId
      );
    }, /Max seed length exceeded/);
  });

  it("Update note (happy path)", async () => {
    await program.methods
      .updateNote(null, newContent)
      .accounts({
        note: notePda,
        user: user.publicKey,
        owner: user.publicKey,
      })
      .signers([user])
      .rpc();

    const noteAccount = await program.account.note.fetch(notePda);
    assert.equal(noteAccount.content, newContent);
  });

  it("Update note — fails when unauthorized", async () => {
    const fake = anchor.web3.Keypair.generate();

    await assert.rejects(
      program.methods
        .updateNote(null, "hack attempt")
        .accounts({
          note: notePda,
          user: fake.publicKey, // wrong signer
          owner: user.publicKey,
        })
        .signers([fake])
        .rpc(),
      /Unauthorized|ConstraintSeeds/
    );
  });

  it("Delete note (happy path)", async () => {
    await program.methods
      .deleteNote()
      .accounts({
        note: notePda,
        user: user.publicKey,
        owner: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Fetch should now fail since the account was closed
    await assert.rejects(async () => {
      await program.account.note.fetch(notePda);
    });
  });
});
