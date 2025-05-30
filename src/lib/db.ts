// import { supabase } from './supabaseClient'; // No longer needed here
import { getPlayerId, getDisplayName } from './player';
import type { GameState, Ending } from './types';

export async function submitRunScore(gameState: GameState, displayNameFromModal?: string): Promise<boolean> {
  const databaseMode = import.meta.env.VITE_DATABASE_MODE;

  // Default to local mode if VITE_DATABASE_MODE is not explicitly 'remote'
  if (databaseMode !== 'remote') {
    console.log(`Database mode is '${databaseMode || 'undefined/not set'}'. Running in local mode: Skipping database submission.`);
    // Optionally, you could store the score locally here if needed for local-only leaderboards
    return true; // Simulate successful submission
  }

  // Proceed with remote submission only if databaseMode === 'remote'
  console.log('Database mode is \'remote\'. Attempting database submission.');

  if (gameState.gameOver === 'playing' || gameState.gameOver === 'intro' || !gameState.gameOver) {
    console.warn('Attempted to submit score for a game that is still playing, in intro, or has no gameOver state.');
    return false;
  }

  const endingDetails = gameState.gameOver as Ending;
  if (!endingDetails.scoreDetails) {
    console.warn('Attempted to submit score, but scoreDetails are missing from gameOver state.');
    return false;
  }

  const playerId = getPlayerId();
  if (!playerId) {
    console.warn('Player ID not found, cannot submit score.');
    return false;
  }

  // Use displayNameFromModal if provided (from the modal input), otherwise get from localStorage
  const displayName = displayNameFromModal || getDisplayName();

  // We only need to send the gameState and playerId to the backend.
  // The backend will extract score and other details.
  try {
    const response = await fetch('/api/submit-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, playerId, displayName }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error submitting score via API:', result.error || response.statusText);
      return false;
    } else {
      console.log('Score submitted successfully via API:', result.message);
      return true;
    }
  } catch (e) {
    console.error('Exception during API score submission:', e);
    return false;
  }
}

// Functions for getting top scores and player's best (as in your example)
// can be added here later if needed for display within the game.
// These would also call new server endpoints. 