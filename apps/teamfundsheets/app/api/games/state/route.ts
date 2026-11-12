import { getGameState, GameError } from '@/lib/games';
import { json, preflight } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
    return preflight(request);
}

/** GET /api/games/state?game=marcie-flight&userId=LC3357 → tries left today + monthly and all-time leaderboards. */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const game = searchParams.get('game') || '';
        const userId = searchParams.get('userId') || '';
        return json(request, await getGameState(game, userId));
    } catch (error) {
        const status = error instanceof GameError ? error.status : 500;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        if (status === 500) console.error('Error loading game state:', error);
        return json(request, { error: msg }, status);
    }
}
