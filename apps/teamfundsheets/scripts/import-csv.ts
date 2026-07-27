import fs from 'fs';
import path from 'path';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
}

const auth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);

interface CsvPayment {
    id: string;
    Month: string;
    Name: string;
    'Transfer Date': string;
    'Amount (IDR)': number;
}

interface CsvExpense {
    id: string;
    Description: string;
    Category: string;
    Date: string;
    'Amount (IDR)': number;
}

async function importData() {
    await doc.loadInfo();
    console.log(`Connected to sheet: ${doc.title}`);

    const csvPath = path.join(process.cwd(), 'teamfund_report_2026-02-12.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').map((l) => l.trim());

    let currentSection = '';
    const payments: CsvPayment[] = [];
    const expenses: CsvExpense[] = [];

    // Parse CSV
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (line === 'PAYMENTS') {
            currentSection = 'PAYMENTS';
            i++; // Skip header
            continue;
        } else if (line === 'EXPENSES') {
            currentSection = 'EXPENSES';
            i++; // Skip header
            continue;
        } else if (line === 'SUMMARY') {
            break;
        }

        if (currentSection === 'PAYMENTS') {
            const [Month, Name, TransferDate, Amount] = line.split(',');
            if (Month && Name && TransferDate && Amount) {
                payments.push({
                    id: crypto.randomUUID(),
                    Month,
                    Name,
                    'Transfer Date': TransferDate,
                    'Amount (IDR)': parseInt(Amount),
                });
            }
        } else if (currentSection === 'EXPENSES') {
            const [Description, Category, DateStr, Amount] = line.split(',');
            if (Description && Category && DateStr && Amount) {
                expenses.push({
                    id: crypto.randomUUID(),
                    Description,
                    Category,
                    Date: DateStr,
                    'Amount (IDR)': parseInt(Amount),
                });
            }
        }
    }

    console.log(`Found ${payments.length} payments and ${expenses.length} expenses to import.`);

    // Import Payments
    if (payments.length > 0) {
        let sheet = doc.sheetsByTitle['Payments'];
        if (!sheet) {
            console.log('Creating Payments sheet...');
            sheet = await doc.addSheet({
                title: 'Payments',
                headerValues: ['id', 'Month', 'Name', 'Transfer Date', 'Amount (IDR)'],
            });
        }

        console.log('Adding payments...');
        await sheet.addRows(payments);
    }

    // Import Expenses
    if (expenses.length > 0) {
        let sheet = doc.sheetsByTitle['Expenses'];
        if (!sheet) {
            console.log('Creating Expenses sheet...');
            sheet = await doc.addSheet({
                title: 'Expenses',
                headerValues: ['id', 'Description', 'Category', 'Date', 'Amount (IDR)'],
            });
        }

        console.log('Adding expenses...');
        await sheet.addRows(expenses);
    }

    console.log('Import completed successfully!');
}

importData().catch(console.error);
