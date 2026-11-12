import { startTry, GameError } from '@/lib/games';
import { json, preflight } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
    return preflight(request);
}

/** POST /api/games/start { game, userId, userName } → uses one of today's tries. */
export async function POST(request: Request) {
    try {
        const { game, userId, userName } = await request.json();
        return json(request, await startTry(String(game || ''), String(userId || ''), String(userName || '')));
    } catch (error) {
        const status = error instanceof GameError ? error.status : 500;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        if (status === 500) console.error('Error starting game try:', error);
        return json(request, { error: msg }, status);
    }
}
