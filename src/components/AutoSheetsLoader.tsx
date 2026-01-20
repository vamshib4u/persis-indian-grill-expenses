'use client';

import { useEffect } from 'react';
import { storage } from '@/lib/storage';
import { DailySales, Transaction } from '@/types';
import { generateId } from '@/lib/utils';

type SheetRows = string[][];

const SESSION_KEY = 'persis_autoload_done';

const toKeyDate = (date: Date) => date.toISOString().split('T')[0];

const parseSheetDate = (value: string) => {
  const num = Number(value);
  if (!Number.isNaN(num) && value.trim() !== '') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + num * 86400000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const headerIndex = (headers: string[], name: string) =>
  headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase().trim());

const parseSales = (rows: SheetRows): DailySales[] => {
  if (!rows.length) return [];
  const headers = rows[0] || [];
  const dateIdx = headerIndex(headers, 'Date');
  const squareIdx = headerIndex(headers, 'Square Sales');
  const cashIdx = headerIndex(headers, 'Cash Collected');
  const notesIdx = headerIndex(headers, 'Notes');
  const holderIdx = headerIndex(headers, 'Cash Holder');

  return rows.slice(1).flatMap(row => {
    const dateValue = row[dateIdx] || '';
    const date = parseSheetDate(dateValue);
    if (!date) return [];
    const squareSales = Number(row[squareIdx] || 0);
    const cashCollected = Number(row[cashIdx] || 0);
    return [
      {
        id: generateId(),
        date,
        squareSales,
        cashCollected,
        cashHolder: row[holderIdx] || '',
        notes: row[notesIdx] || '',
        createdAt: new Date(),
      },
    ];
  });
};

const parseExpenses = (rows: SheetRows): Transaction[] => {
  if (!rows.length) return [];
  const headers = rows[0] || [];
  const dateIdx = headerIndex(headers, 'Date');
  const categoryIdx = headerIndex(headers, 'Category');
  const amountIdx = headerIndex(headers, 'Amount');
  const paymentIdx = headerIndex(headers, 'Payment Method');
  const descIdx = headerIndex(headers, 'Description');
  const spentByIdx = headerIndex(headers, 'Spent By');
  const notesIdx = headerIndex(headers, 'Notes');

  return rows.slice(1).flatMap(row => {
    const dateValue = row[dateIdx] || '';
    const date = parseSheetDate(dateValue);
    if (!date) return [];
    return [
      {
        id: generateId(),
        date,
        type: 'expense',
        category: row[categoryIdx] || '',
        amount: Number(row[amountIdx] || 0),
        paymentMethod: (row[paymentIdx] || 'cash') as 'cash' | 'card' | 'bank_transfer',
        description: row[descIdx] || '',
        spentBy: row[spentByIdx] || '',
        notes: row[notesIdx] || '',
        createdAt: new Date(),
      },
    ];
  });
};

const parsePayouts = (rows: SheetRows): Transaction[] => {
  if (!rows.length) return [];
  const headers = rows[0] || [];
  const dateIdx = headerIndex(headers, 'Date');
  const payeeIdx = headerIndex(headers, 'Payee');
  const amountIdx = headerIndex(headers, 'Amount');
  const purposeIdx = headerIndex(headers, 'Purpose');
  const paymentIdx = headerIndex(headers, 'Payment Method');
  const notesIdx = headerIndex(headers, 'Notes');

  return rows.slice(1).flatMap(row => {
    const dateValue = row[dateIdx] || '';
    const date = parseSheetDate(dateValue);
    if (!date) return [];
    return [
      {
        id: generateId(),
        date,
        type: 'payout',
        category: 'Payout',
        amount: Number(row[amountIdx] || 0),
        paymentMethod: (row[paymentIdx] || 'cash') as 'cash' | 'card' | 'bank_transfer',
        description: '',
        payeeName: row[payeeIdx] || '',
        purpose: row[purposeIdx] || '',
        notes: row[notesIdx] || '',
        createdAt: new Date(),
      },
    ];
  });
};

const keyForSale = (s: DailySales) =>
  [
    toKeyDate(new Date(s.date)),
    s.squareSales,
    s.cashCollected,
    s.cashHolder || '',
    s.notes || '',
  ].join('|');

const keyForTransaction = (t: Transaction) =>
  [
    t.type,
    toKeyDate(new Date(t.date)),
    t.amount,
    t.category || '',
    t.description || '',
    t.payeeName || '',
    t.purpose || '',
    t.paymentMethod || '',
    t.spentBy || '',
    t.notes || '',
  ].join('|');

export const AutoSheetsLoader = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, 'true');

    const load = async () => {
      try {
        const res = await fetch('/api/google/load');
        if (!res.ok) return;
        const payload = (await res.json()) as {
          sales: SheetRows;
          expenses: SheetRows;
          payouts: SheetRows;
        };

        const incomingSales = parseSales(payload.sales || []);
        const incomingExpenses = parseExpenses(payload.expenses || []);
        const incomingPayouts = parsePayouts(payload.payouts || []);

        const existingSales = storage.getSales();
        const existingTransactions = storage.getTransactions();

        const salesKeys = new Set(existingSales.map(keyForSale));
        const transactionKeys = new Set(existingTransactions.map(keyForTransaction));

        const mergedSales = [
          ...existingSales,
          ...incomingSales.filter(s => !salesKeys.has(keyForSale(s))),
        ];
        const mergedTransactions = [
          ...existingTransactions,
          ...incomingExpenses.filter(t => !transactionKeys.has(keyForTransaction(t))),
          ...incomingPayouts.filter(t => !transactionKeys.has(keyForTransaction(t))),
        ];

        if (mergedSales.length !== existingSales.length) {
          storage.setSales(mergedSales);
        }
        if (mergedTransactions.length !== existingTransactions.length) {
          storage.setTransactions(mergedTransactions);
        }
      } catch {
        // ignore auto-load failures to keep UI usable
      }
    };

    void load();
  }, []);

  return null;
};
