import { NextResponse } from 'next/server';
import { deletePayment } from '@/lib/google-sheets';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deletePayment(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to delete payment', details: msg }, { status: 500 });
    }
}
