import { NextResponse } from 'next/server';

/**
 * The hub (a different origin) calls the /api/games routes directly.
 * Allowed origins: HUB_ORIGINS env (comma-separated) or the hub's local and production URLs.
 */
const DEFAULT_ORIGINS = ['http://localhost:5173', 'https://valueengineeringhub.vercel.app'];

function allowedOrigins(): string[] {
    const env = process.env.HUB_ORIGINS;
    return env ? env.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_ORIGINS;
}

export function corsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('origin') || '';
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
    };
    if (allowedOrigins().includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}

export function json(request: Request, body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

export function preflight(request: Request) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}
