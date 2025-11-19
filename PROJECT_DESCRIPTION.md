# Project Description

**Deployed Frontend URL:** (no deployed URL) — frontend is in `frontend/`

**Solana Program ID:** `6FHDE4qJYPSstm8kvBTYBQAd3sykJV9e2K5gskNQGAQ2`

## Project Overview

### Description
This project is a simple Solana Notes dApp built with Anchor and a Next.js frontend. Users can create, update, and delete short notes. Each note is stored on-chain in a PDA-owned account so notes are deterministic and owned by the creating wallet.

### Key Features
- **Create Note:** Create a new on-chain note with a `title` and `content`.
- **Update Note:** Update the title and/or content of an existing note (owner-only).
- **Delete Note:** Close the note account and reclaim rent to the owner (owner-only).
- **Client Validations:** Enforced limits for title and content length (title ≤ 50 chars, content ≤ 500 chars).

### How to Use the dApp
1. **Connect Wallet:** Use Phantom or another Solana wallet in the frontend.
2. **Create Note:** Provide a title and content and submit. The note account is created as a PDA derived from your wallet and the title.
3. **Update/Delete:** Use the frontend buttons to update or delete notes — only the note owner can perform these actions.

## Program Architecture

The program is written in Rust using Anchor and follows a straightforward client → program → account flow. The client derives the Note PDA from seeds `["note", user_pubkey, title]` and sends a signed transaction to the program. The program validates inputs (title/content length, non-empty title), initializes or mutates the `Note` account using `#[account]` and `#[derive(Accounts)]` constraints, stores a `bump` in the account via `ctx.bumps.note`, and sets `created_at`/`updated_at` timestamps via `Clock`. Ownership is enforced via the `has_one = owner` constraint on update/delete handlers and the `close = user` attribute on the delete instruction returns lamports to the owner. Account sizing is calculated by `Note::LEN` in the program to allocate sufficient space for strings and fields.


### PDA Usage
- **Note PDA:** Derived with seeds `['note', user_wallet_pubkey, title]` so each user+title pair maps to a deterministic account. The program computes this PDA when creating/updating/deleting notes.

### Program Instructions
- **`create_note(title, content)`**: Initializes a `Note` account at the PDA, sets owner, title, content, timestamps, and bump. Fails if title length > 50 or content length > 500 or title is empty.
- **`update_note(option<new_title>, option<new_content>)`**: Updates fields on the `Note` account; enforces ownership and length limits.
- **`delete_note()`**: Closes the `Note` account and transfers lamports to the caller.

### Account Structure
`Note` account (stored on-chain):
- **owner:** `Pubkey` — wallet that owns the note
- **title:** `String` — note title (max 50 chars)
- **content:** `String` — note body (max 500 chars)
- **created_at:** `i64` — unix timestamp of creation
- **updated_at:** `i64` — unix timestamp of last update
- **bump:** `u8` — PDA bump

Rust struct (reference):
```rust
#[account]
pub struct Note {
        pub owner: Pubkey,
        pub title: String,
        pub content: String,
        pub created_at: i64,
        pub updated_at: i64,
        pub bump: u8,
}
```

## Testing

### Test Coverage
Tests are in `anchor_program/tests/anchor_program.ts` and cover both happy and unhappy paths.

**Happy Path Tests:**
- Create note: verifies account fields, owner and bump.
- Update note: verifies content/title updates.
- Delete note: verifies the account is closed and cannot be fetched afterwards.

**Unhappy Path Tests:**
- Create with too-long title: client-side PDA derivation fails when seed exceeds 32 bytes.
- Unauthorized update: fails when a non-owner attempts to update (program `Unauthorized` or Anchor `ConstraintSeeds` may be observed depending on client inputs).

### Running Tests
- From the project root run:
```bash
cd anchor_program
anchor test
```

### Frontend
- Frontend code is in `frontend/`. To run locally:
```bash
cd frontend
npm install
npm run dev
```

## Additional Notes
- Program constraints: title ≤ 50 characters, content ≤ 500 characters.
- PDA seed length limits apply: very long titles can cause client-side seed errors (seeds must be ≤ 32 bytes each).
- Program ID in this repo matches the `declare_id!` in `programs/anchor_program/src/lib.rs`.