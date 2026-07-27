import { NextResponse } from 'next/server';
import { getPayments, addPayment } from '@/lib/google-sheets';

export async function GET() {
    try {
        const payments = await getPayments();
        return NextResponse.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch payments', details: msg }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.month || !body.name || !body.amount) {
            return NextResponse.json({ error: 'Missing required fields: month, name, amount' }, { status: 400 });
        }

        const newPayment = {
            id: body.id || crypto.randomUUID(),
            month: body.month,
            name: body.name,
            transferDate: body.transferDate || new Date().toISOString().split('T')[0],
            amount: Number(body.amount),
        };

        await addPayment(newPayment);
        return NextResponse.json(newPayment);
    } catch (error) {
        console.error('Error adding payment:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to add payment', details: msg }, { status: 500 });
    }
}
