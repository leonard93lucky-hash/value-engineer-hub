import { NextResponse } from 'next/server';
import { getExpenses, addExpense } from '@/lib/google-sheets';

export async function GET() {
    try {
        const expenses = await getExpenses();
        return NextResponse.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch expenses', details: msg }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.description || !body.amount) {
            return NextResponse.json({ error: 'Missing required fields: description, amount' }, { status: 400 });
        }

        const newExpense = {
            id: body.id || crypto.randomUUID(),
            description: body.description,
            category: body.category || 'Uncategorized',
            date: body.date || new Date().toISOString().split('T')[0],
            amount: Number(body.amount),
        };

        await addExpense(newExpense);
        return NextResponse.json(newExpense);
    } catch (error) {
        console.error('Error adding expense:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to add expense', details: msg }, { status: 500 });
    }
}
