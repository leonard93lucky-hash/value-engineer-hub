import { NextResponse } from 'next/server';
import { deleteExpense } from '@/lib/google-sheets';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteExpense(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to delete expense', details: msg }, { status: 500 });
    }
}
