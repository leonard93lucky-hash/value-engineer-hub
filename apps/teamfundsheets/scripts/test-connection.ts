import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { loadEnvConfig } from '@next/env';

// Load environment variables
loadEnvConfig(process.cwd());

async function testConnection() {
    console.log('Testing Google Sheets connection...');
    console.log('');

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId || !clientEmail || !privateKey) {
        console.error('[FAIL] Missing credentials in .env.local');
        console.error('  GOOGLE_SPREADSHEET_ID:', spreadsheetId ? 'SET' : 'MISSING');
        console.error('  GOOGLE_SERVICE_ACCOUNT_EMAIL:', clientEmail ? 'SET' : 'MISSING');
        console.error('  GOOGLE_PRIVATE_KEY:', privateKey ? 'SET' : 'MISSING');
        return;
    }

    console.log('[OK] All credentials found in .env.local');

    try {
        const auth = new JWT({
            email: clientEmail,
            key: privateKey.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, auth);
        await doc.loadInfo();
        console.log(`[OK] Connected to spreadsheet: "${doc.title}"`);
        console.log('');

        // List sheets
        console.log('Sheets found:');
        for (const sheet of doc.sheetsByIndex) {
            console.log(`  - "${sheet.title}" (${sheet.rowCount} rows)`);
        }
        console.log('');

        // Try reading Payments
        const paymentsSheet = doc.sheetsByTitle['Payments'];
        if (paymentsSheet) {
            const rows = await paymentsSheet.getRows();
            console.log(`[OK] Payments sheet: ${rows.length} data rows`);
            if (rows.length > 0) {
                console.log('  Sample:', {
                    id: rows[0].get('id'),
                    Month: rows[0].get('Month'),
                    Name: rows[0].get('Name'),
                    Amount: rows[0].get('Amount (IDR)'),
                });
            }
        } else {
            console.log('[WARN] No "Payments" sheet found');
        }

        // Try reading Expenses
        const expensesSheet = doc.sheetsByTitle['Expenses'];
        if (expensesSheet) {
            const rows = await expensesSheet.getRows();
            console.log(`[OK] Expenses sheet: ${rows.length} data rows`);
            if (rows.length > 0) {
                console.log('  Sample:', {
                    id: rows[0].get('id'),
                    Description: rows[0].get('Description'),
                    Category: rows[0].get('Category'),
                    Amount: rows[0].get('Amount (IDR)'),
                });
            }
        } else {
            console.log('[WARN] No "Expenses" sheet found');
        }

        console.log('');
        console.log('=== All tests passed! ===');
    } catch (error) {
        console.error('[FAIL] Connection error:');
        if (error instanceof Error) {
            console.error('  Message:', error.message);
            if (error.message.includes('DECODER')) {
                console.error('  Hint: The GOOGLE_PRIVATE_KEY might be malformed. Check for extra escaping.');
            }
            if (error.message.includes('not found')) {
                console.error('  Hint: Make sure the spreadsheet is shared with:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
            }
        } else {
            console.error(error);
        }
    }
}

testConnection();
