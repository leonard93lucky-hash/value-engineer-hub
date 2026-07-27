import { NextResponse } from 'next/server';
import { getPayments, getExpenses } from '@/lib/google-sheets';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonthIndex(month: string): number {
  return MONTHS.indexOf(month);
}

export async function GET() {
  try {
    const [payments, expenses] = await Promise.all([
      getPayments(),
      getExpenses(),
    ]);

    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const uniqueNames = [...new Set(payments.map(p => p.name))];
    const memberCount = uniqueNames.length || 1;
    const INDIVIDUAL_TARGET = 600000;
    const monthlyBudget = memberCount * INDIVIDUAL_TARGET;

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const monthsElapsed = currentMonthIndex + 1;
    const pv = monthsElapsed * monthlyBudget;
    const ev = totalPayments;
    const ac = totalExpenses;

    const pvPerMember = uniqueNames.map(name => {
      const memberTotal = payments
        .filter(p => p.name === name)
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        name,
        planned: monthsElapsed * INDIVIDUAL_TARGET,
        earned: memberTotal,
        variance: memberTotal - (monthsElapsed * INDIVIDUAL_TARGET),
      };
    });

    const monthlyData = MONTHS.map((month, idx) => {
      if (idx > currentMonthIndex) return null;
      const monthPayments = payments
        .filter(p => p.month === month)
        .reduce((sum, p) => sum + p.amount, 0);
      const monthExpenses = expenses
        .filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === idx;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        month,
        planned: monthlyBudget,
        earned: monthPayments,
        actual: monthExpenses,
      };
    }).filter(Boolean);

    const sv = ev - pv;
    const cv = ev - ac;
    const spi = pv > 0 ? ev / pv : 0;
    const cpi = ac > 0 ? ev / ac : ev > 0 ? Infinity : 0;

    const bac = 12 * monthlyBudget;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - ac;
    const tcipi = bac - ac > 0 ? (bac - ev) / (bac - ac) : 0;

    return NextResponse.json({
      summary: {
        memberCount,
        monthlyBudget,
        monthsElapsed,
        pv: Math.round(pv),
        ev: Math.round(ev),
        ac: Math.round(ac),
        sv: Math.round(sv),
        cv: Math.round(cv),
        spi: Math.round(spi * 100) / 100,
        cpi: cpi === Infinity ? null : Math.round(cpi * 100) / 100,
        bac: Math.round(bac),
        eac: Math.round(eac),
        etc: Math.round(etc),
        tcipi: Math.round(tcipi * 100) / 100,
      },
      perMember: pvPerMember.map(m => ({
        ...m,
        variance: Math.round(m.variance),
        performance: m.planned > 0
          ? Math.round((m.earned / m.planned) * 100)
          : 0,
      })),
      monthly: monthlyData.map(m => ({
        ...m,
        planned: Math.round(m.planned),
        earned: Math.round(m.earned),
        actual: Math.round(m.actual),
      })),
    });
  } catch (error) {
    console.error('Error calculating EVM:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to calculate EVM', details: msg }, { status: 500 });
  }
}
