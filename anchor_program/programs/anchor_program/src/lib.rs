use anchor_lang::prelude::*;

declare_id!("6FHDE4qJYPSstm8kvBTYBQAd3sykJV9e2K5gskNQGAQ2");

#[program]
pub mod solana_notes {
    use super::*;

    pub fn create_note(ctx: Context<CreateNote>, title: String, content: String) -> Result<()> {
        require!(title.len() <= 50, NoteError::TitleTooLong);
        require!(content.len() <= 500, NoteError::ContentTooLong);
        require!(!title.is_empty(), NoteError::TitleEmpty);

        let note = &mut ctx.accounts.note;
        let clock = Clock::get()?;

        note.owner = ctx.accounts.user.key();
        note.title = title;
        note.content = content;
        note.created_at = clock.unix_timestamp;
        note.updated_at = clock.unix_timestamp;
        note.bump = ctx.bumps.note;

        Ok(())
    }

    pub fn update_note(
        ctx: Context<UpdateNote>,
        title: Option<String>,
        content: Option<String>,
    ) -> Result<()> {
        let note = &mut ctx.accounts.note;

        if let Some(new_title) = title {
            require!(new_title.len() <= 50, NoteError::TitleTooLong);
            require!(!new_title.is_empty(), NoteError::TitleEmpty);
            note.title = new_title;
        }

        if let Some(new_content) = content {
            require!(new_content.len() <= 500, NoteError::ContentTooLong);
            note.content = new_content;
        }

        note.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn delete_note(_ctx: Context<DeleteNote>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateNote<'info> {
    #[account(
        init,
        payer = user,
        space = Note::LEN,
        seeds = [b"note", user.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub note: Account<'info, Note>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateNote<'info> {
    #[account(
        mut,
        seeds = [b"note", user.key().as_ref(), note.title.as_bytes()],
        bump = note.bump,
        has_one = owner @ NoteError::Unauthorized
    )]
    pub note: Account<'info, Note>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Verified by has_one constraint
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DeleteNote<'info> {
    #[account(
        mut,
        seeds = [b"note", user.key().as_ref(), note.title.as_bytes()],
        bump = note.bump,
        has_one = owner @ NoteError::Unauthorized,
        close = user
    )]
    pub note: Account<'info, Note>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Verified by has_one constraint
    pub owner: AccountInfo<'info>,
}

#[account]
pub struct Note {
    pub owner: Pubkey,
    pub title: String,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl Note {
    pub const LEN: usize = 8 + 32 + 4 + 50 + 4 + 500 + 8 + 8 + 1;
}

#[error_code]
pub enum NoteError {
    #[msg("Title too long (max 50 characters)")]
    TitleTooLong,
    #[msg("Content too long (max 500 characters)")]
    ContentTooLong,
    #[msg("Title cannot be empty")]
    TitleEmpty,
    #[msg("Unauthorized")]
    Unauthorized,
}