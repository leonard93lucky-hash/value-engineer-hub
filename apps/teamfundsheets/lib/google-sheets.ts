import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Payment, Expense } from '@/lib/types';

let doc: GoogleSpreadsheet | null = null;
let docPromise: Promise<GoogleSpreadsheet> | null = null;

async function initDoc(): Promise<GoogleSpreadsheet> {
    const spreadsheetId = process.env.TF_GOOGLE_SPREADSHEET_ID;
    const clientEmail = process.env.TF_GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.TF_GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId || !clientEmail || !privateKey) {
        throw new Error(
            'Missing Google Sheets credentials. Check TF_GOOGLE_SPREADSHEET_ID, TF_GOOGLE_SERVICE_ACCOUNT_EMAIL, and TF_GOOGLE_PRIVATE_KEY'
        );
    }

    const auth = new JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const newDoc = new GoogleSpreadsheet(spreadsheetId, auth);
    await newDoc.loadInfo();
    return newDoc;
}

export const getDoc = async (): Promise<GoogleSpreadsheet> => {
    if (doc) return doc;

    // Prevent race condition: if multiple calls happen before the first resolves,
    // they all share the same promise
    if (!docPromise) {
        docPromise = initDoc()
            .then((d) => {
                doc = d;
                return d;
            })
            .catch((err) => {
                docPromise = null; // Reset so next call retries
                throw err;
            });
    }

    return docPromise;
};

// --- Payments ---

export const getPayments = async (): Promise<Payment[]> => {
    const d = await getDoc();
    let sheet = d.sheetsByTitle['Payments'];
    if (!sheet) {
        // Try the first sheet as fallback
        sheet = d.sheetsByIndex[0];
        if (!sheet) return [];
    }

    const rows = await sheet.getRows();
    return rows.map((row) => ({
        id: row.get('id') || '',
        month: row.get('Month') || '',
        name: row.get('Name') || '',
        transferDate: row.get('Transfer Date') || '',
        amount: parseInt(row.get('Amount (IDR)') || '0', 10),
    }));
};

export const addPayment = async (payment: Payment) => {
    const d = await getDoc();
    let sheet = d.sheetsByTitle['Payments'];
    if (!sheet) {
        sheet = await d.addSheet({
            title: 'Payments',
            headerValues: ['id', 'Month', 'Name', 'Transfer Date', 'Amount (IDR)'],
        });
    }

    await sheet.addRow({
        id: payment.id,
        Month: payment.month,
        Name: payment.name,
        'Transfer Date': payment.transferDate,
        'Amount (IDR)': payment.amount,
    });
};

export const deletePayment = async (id: string) => {
    const d = await getDoc();
    const sheet = d.sheetsByTitle['Payments'];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const rowToDelete = rows.find((row) => row.get('id') === id);
    if (rowToDelete) {
        await rowToDelete.delete();
    }
};

// --- Expenses ---

export const getExpenses = async (): Promise<Expense[]> => {
    const d = await getDoc();
    const sheet = d.sheetsByTitle['Expenses'];
    if (!sheet) return [];

    const rows = await sheet.getRows();
    return rows.map((row) => ({
        id: row.get('id') || '',
        description: row.get('Description') || '',
        category: row.get('Category') || '',
        date: row.get('Date') || '',
        amount: parseInt(row.get('Amount (IDR)') || '0', 10),
    }));
};

export const addExpense = async (expense: Expense) => {
    const d = await getDoc();
    let sheet = d.sheetsByTitle['Expenses'];
    if (!sheet) {
        sheet = await d.addSheet({
            title: 'Expenses',
            headerValues: ['id', 'Description', 'Category', 'Date', 'Amount (IDR)'],
        });
    }

    await sheet.addRow({
        id: expense.id,
        Description: expense.description,
        Category: expense.category,
        Date: expense.date,
        'Amount (IDR)': expense.amount,
    });
};

export const deleteExpense = async (id: string) => {
    const d = await getDoc();
    const sheet = d.sheetsByTitle['Expenses'];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const rowToDelete = rows.find((row) => row.get('id') === id);
    if (rowToDelete) {
        await rowToDelete.delete();
    }
};

// --- Targets ---

export const getYearlyTarget = async (year: number): Promise<number> => {
    const d = await getDoc();
    let sheet = d.sheetsByTitle['YearlyTarget'];
    if (!sheet) {
        sheet = await d.addSheet({
            title: 'YearlyTarget',
            headerValues: ['id', 'Year', 'Monthly Target'],
        });
        return 0;
    }

    const rows = await sheet.getRows();
    const match = rows.find((row) => parseInt(row.get('Year') || '0', 10) === year);
    return match ? parseInt(match.get('Monthly Target') || '0', 10) : 0;
};

export const setYearlyTarget = async (year: number, monthlyTarget: number) => {
    const d = await getDoc();
    let sheet = d.sheetsByTitle['YearlyTarget'];
    if (!sheet) {
        sheet = await d.addSheet({
            title: 'YearlyTarget',
            headerValues: ['id', 'Year', 'Monthly Target'],
        });
    }

    const rows = await sheet.getRows();
    const existing = rows.find((row) => parseInt(row.get('Year') || '0', 10) === year);

    if (existing) {
        existing.set('Monthly Target', monthlyTarget);
        await existing.save();
    } else {
        await sheet.addRow({
            id: `${year}`,
            Year: year,
            'Monthly Target': monthlyTarget,
        });
    }
};
