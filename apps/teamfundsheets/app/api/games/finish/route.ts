import { finishTry, GameError } from '@/lib/games';
import { json, preflight } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
    return preflight(request);
}

/** POST /api/games/finish { game, userId, tryId, score } → saves the score of a started try. */
export async function POST(request: Request) {
    try {
        const { game, userId, tryId, score } = await request.json();
        return json(request, await finishTry(String(game || ''), String(userId || ''), String(tryId || ''), Number(score)));
    } catch (error) {
        const status = error instanceof GameError ? error.status : 500;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        if (status === 500) console.error('Error saving game score:', error);
        return json(request, { error: msg }, status);
    }
}
