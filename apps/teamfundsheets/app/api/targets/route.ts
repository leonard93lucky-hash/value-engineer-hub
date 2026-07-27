import { NextResponse } from 'next/server';
import { getYearlyTarget, setYearlyTarget } from '@/lib/google-sheets';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
        const target = await getYearlyTarget(year);
        return NextResponse.json({ year, monthlyTarget: target || 600000 });
    } catch (error) {
        console.error('Error fetching target:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch target', details: msg }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { year, monthlyTarget } = body;

        if (!year || monthlyTarget == null) {
            return NextResponse.json({ error: 'Missing required fields: year, monthlyTarget' }, { status: 400 });
        }

        await setYearlyTarget(Number(year), Number(monthlyTarget));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating target:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to update target', details: msg }, { status: 500 });
    }
}
