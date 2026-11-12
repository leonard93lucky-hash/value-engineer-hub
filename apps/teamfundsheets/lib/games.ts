import type { GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { getDoc } from '@/lib/google-sheets';

/**
 * Daily mini games for the Value Engineering Hub "Games" page.
 * Scores live in the "GameScores" tab of the Team Fund spreadsheet.
 * One row per try: it is created when a try starts and gets its score when the try ends,
 * so reloading the page mid-run still uses up that try.
 */

const SHEET_TITLE = 'GameScores';
const HEADERS = ['id', 'game', 'date', 'userId', 'userName', 'score', 'startedAt', 'finishedAt'];

export const MAX_TRIES_PER_DAY = 3;

/** Per-game limits used to reject impossible scores. */
export const GAMES: Record<string, { maxScore: number; maxPointsPerSecond: number }> = {
    // Marcie's flight: one point per gap; gaps arrive at most ~1 per second at top speed.
    'marcie-flight': { maxScore: 2000, maxPointsPerSecond: 1.5 },
};

export class GameError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/** Date parts in WIB (Asia/Jakarta). */
export function wibDate(d = new Date()): { day: string; month: string } {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    return { day, month: day.slice(0, 7) };
}

async function getSheet(): Promise<GoogleSpreadsheetWorksheet> {
    const d = await getDoc();
    let sheet = d.sheetsByTitle[SHEET_TITLE];
    if (!sheet) {
        // Another server instance may have created it since this instance loaded the doc.
        await d.loadInfo();
        sheet = d.sheetsByTitle[SHEET_TITLE];
    }
    if (!sheet) sheet = await d.addSheet({ title: SHEET_TITLE, headerValues: HEADERS });
    return sheet;
}

interface ScoreRow {
    id: string;
    game: string;
    date: string;
    userId: string;
    userName: string;
    score: number;
    startedAt: string;
    finishedAt: string;
}

async function readRows(game: string) {
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const data: ScoreRow[] = rows.map(r => ({
        id: r.get('id') || '',
        game: r.get('game') || '',
        date: r.get('date') || '',
        userId: r.get('userId') || '',
        userName: r.get('userName') || '',
        score: parseInt(r.get('score') || '0', 10) || 0,
        startedAt: r.get('startedAt') || '',
        finishedAt: r.get('finishedAt') || '',
    }));
    return { sheet, rows, data: data.filter(d => d.game === game) };
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    best: number;
    tries: number;
}

function leaderboard(rows: ScoreRow[], limit = 10, userId?: string) {
    const byUser = new Map<string, { userName: string; best: number; tries: number }>();
    for (const r of rows) {
        if (!r.finishedAt) continue;
        const cur = byUser.get(r.userId) || { userName: r.userName, best: 0, tries: 0 };
        cur.tries += 1;
        if (r.score > cur.best) cur.best = r.score;
        if (r.userName) cur.userName = r.userName;
        byUser.set(r.userId, cur);
    }
    const sorted = [...byUser.entries()]
        .sort((a, b) => b[1].best - a[1].best || a[1].userName.localeCompare(b[1].userName))
        .map(([id, v], i) => ({ rank: i + 1, userId: id, userName: v.userName, best: v.best, tries: v.tries }));
    return { top: sorted.slice(0, limit), me: userId ? sorted.find(e => e.userId === userId) || null : null, players: sorted.length };
}

export async function getGameState(game: string, userId: string) {
    if (!GAMES[game]) throw new GameError('Unknown game', 404);
    const { data } = await readRows(game);
    const { day, month } = wibDate();
    const mineToday = data.filter(r => r.userId === userId && r.date === day);
    return {
        game,
        date: day,
        month,
        maxTries: MAX_TRIES_PER_DAY,
        triesUsed: mineToday.length,
        triesLeft: Math.max(0, MAX_TRIES_PER_DAY - mineToday.length),
        bestToday: mineToday.reduce((m, r) => Math.max(m, r.finishedAt ? r.score : 0), 0),
        monthly: leaderboard(data.filter(r => r.date.startsWith(month)), 10, userId),
        allTime: leaderboard(data, 10, userId),
    };
}

export async function startTry(game: string, userId: string, userName: string) {
    if (!GAMES[game]) throw new GameError('Unknown game', 404);
    if (!userId) throw new GameError('Missing userId', 400);
    const { sheet, data } = await readRows(game);
    const { day } = wibDate();
    const used = data.filter(r => r.userId === userId && r.date === day).length;
    if (used >= MAX_TRIES_PER_DAY) throw new GameError('No tries left today', 429);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await sheet.addRow({
        id, game, date: day, userId, userName: userName || userId, score: 0,
        startedAt: new Date().toISOString(), finishedAt: '',
    });
    return { tryId: id, triesLeft: MAX_TRIES_PER_DAY - used - 1 };
}

export async function finishTry(game: string, userId: string, tryId: string, score: number) {
    const rules = GAMES[game];
    if (!rules) throw new GameError('Unknown game', 404);
    if (!Number.isInteger(score) || score < 0) throw new GameError('Invalid score', 400);
    const { rows } = await readRows(game);
    const row = rows.find(r => r.get('id') === tryId && r.get('userId') === userId && r.get('game') === game);
    if (!row) throw new GameError('Try not found', 404);
    if (row.get('finishedAt')) throw new GameError('This try already has a score', 409);
    const elapsed = (Date.now() - new Date(row.get('startedAt')).getTime()) / 1000;
    const ceiling = Math.min(rules.maxScore, Math.floor(elapsed * rules.maxPointsPerSecond) + 2);
    if (score > ceiling) throw new GameError('Score is not possible for the time played', 422);
    row.set('score', score);
    row.set('finishedAt', new Date().toISOString());
    await row.save();
    return { score };
}
