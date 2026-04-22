import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { DailySales, Transaction } from '@/types';

const saleSchema = z.object({
  id: z.string().min(1),
  date: z.coerce.date(),
  squareSales: z.coerce.number().finite(),
  cashCollected: z.coerce.number().finite(),
  cashHolder: z.string().min(1),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

const transactionSchema = z.object({
  id: z.string().min(1),
  date: z.coerce.date(),
  type: z.enum(['expense', 'payout']),
  category: z.string().min(1),
  amount: z.coerce.number().finite(),
  description: z.string(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer']),
  spentBy: z.string().optional().nullable(),
  payeeName: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

type SaleInput = z.input<typeof saleSchema>;
type TransactionInput = z.input<typeof transactionSchema>;

declare global {
  var __persisSchemaReady: Promise<void> | undefined;
}

const getSql = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(databaseUrl);
};

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const mapSale = (sale: SaleInput): DailySales => {
  const parsed = saleSchema.parse(sale);
  return {
    id: parsed.id,
    date: toDateOnly(parsed.date),
    squareSales: parsed.squareSales,
    cashCollected: parsed.cashCollected,
    cashHolder: parsed.cashHolder,
    notes: parsed.notes ?? '',
    createdAt: parsed.createdAt.toISOString(),
  };
};

const mapTransaction = (transaction: TransactionInput): Transaction => {
  const parsed = transactionSchema.parse(transaction);
  return {
    id: parsed.id,
    date: toDateOnly(parsed.date),
    type: parsed.type,
    category: parsed.category,
    amount: parsed.amount,
    description: parsed.description,
    paymentMethod: parsed.paymentMethod,
    spentBy: parsed.spentBy ?? '',
    payeeName: parsed.payeeName ?? '',
    purpose: parsed.purpose ?? '',
    notes: parsed.notes ?? '',
    createdAt: parsed.createdAt.toISOString(),
  };
};

export async function ensureSchema() {
  if (!globalThis.__persisSchemaReady) {
    globalThis.__persisSchemaReady = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          sale_date DATE NOT NULL,
          square_sales NUMERIC(12, 2) NOT NULL,
          cash_collected NUMERIC(12, 2) NOT NULL,
          cash_holder TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          transaction_date DATE NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('expense', 'payout')),
          category TEXT NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
          spent_by TEXT,
          payee_name TEXT,
          purpose TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`CREATE INDEX IF NOT EXISTS sales_sale_date_idx ON sales (sale_date DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS transactions_transaction_date_idx ON transactions (transaction_date DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions (type)`;
    })();
  }

  return globalThis.__persisSchemaReady;
}

export async function listSales(): Promise<DailySales[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      sale_date AS date,
      square_sales::float8 AS "squareSales",
      cash_collected::float8 AS "cashCollected",
      cash_holder AS "cashHolder",
      notes,
      created_at AS "createdAt"
    FROM sales
    ORDER BY sale_date ASC, created_at ASC
  `) as SaleInput[];

  return rows.map(mapSale);
}

export async function createSale(input: SaleInput): Promise<DailySales> {
  const sale = saleSchema.parse(input);
  await ensureSchema();
  const sql = getSql();

  const [row] = (await sql`
    INSERT INTO sales (
      id,
      sale_date,
      square_sales,
      cash_collected,
      cash_holder,
      notes,
      created_at
    )
    VALUES (
      ${sale.id},
      ${toDateOnly(sale.date)},
      ${sale.squareSales},
      ${sale.cashCollected},
      ${sale.cashHolder},
      ${sale.notes ?? ''},
      ${sale.createdAt.toISOString()}
    )
    RETURNING
      id,
      sale_date AS date,
      square_sales::float8 AS "squareSales",
      cash_collected::float8 AS "cashCollected",
      cash_holder AS "cashHolder",
      notes,
      created_at AS "createdAt"
  `) as SaleInput[];

  return mapSale(row);
}

export async function updateSale(input: SaleInput): Promise<DailySales | null> {
  const sale = saleSchema.parse(input);
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    UPDATE sales
    SET
      sale_date = ${toDateOnly(sale.date)},
      square_sales = ${sale.squareSales},
      cash_collected = ${sale.cashCollected},
      cash_holder = ${sale.cashHolder},
      notes = ${sale.notes ?? ''},
      created_at = ${sale.createdAt.toISOString()}
    WHERE id = ${sale.id}
    RETURNING
      id,
      sale_date AS date,
      square_sales::float8 AS "squareSales",
      cash_collected::float8 AS "cashCollected",
      cash_holder AS "cashHolder",
      notes,
      created_at AS "createdAt"
  `) as SaleInput[];

  return rows[0] ? mapSale(rows[0]) : null;
}

export async function deleteSale(id: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM sales
    WHERE id = ${id}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function listTransactions(): Promise<Transaction[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      transaction_date AS date,
      type,
      category,
      amount::float8 AS amount,
      description,
      payment_method AS "paymentMethod",
      spent_by AS "spentBy",
      payee_name AS "payeeName",
      purpose,
      notes,
      created_at AS "createdAt"
    FROM transactions
    ORDER BY transaction_date ASC, created_at ASC
  `) as TransactionInput[];

  return rows.map(mapTransaction);
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const transaction = transactionSchema.parse(input);
  await ensureSchema();
  const sql = getSql();

  const [row] = (await sql`
    INSERT INTO transactions (
      id,
      transaction_date,
      type,
      category,
      amount,
      description,
      payment_method,
      spent_by,
      payee_name,
      purpose,
      notes,
      created_at
    )
    VALUES (
      ${transaction.id},
      ${toDateOnly(transaction.date)},
      ${transaction.type},
      ${transaction.category},
      ${transaction.amount},
      ${transaction.description},
      ${transaction.paymentMethod},
      ${transaction.spentBy ?? ''},
      ${transaction.payeeName ?? ''},
      ${transaction.purpose ?? ''},
      ${transaction.notes ?? ''},
      ${transaction.createdAt.toISOString()}
    )
    RETURNING
      id,
      transaction_date AS date,
      type,
      category,
      amount::float8 AS amount,
      description,
      payment_method AS "paymentMethod",
      spent_by AS "spentBy",
      payee_name AS "payeeName",
      purpose,
      notes,
      created_at AS "createdAt"
  `) as TransactionInput[];

  return mapTransaction(row);
}

export async function updateTransaction(input: TransactionInput): Promise<Transaction | null> {
  const transaction = transactionSchema.parse(input);
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    UPDATE transactions
    SET
      transaction_date = ${toDateOnly(transaction.date)},
      type = ${transaction.type},
      category = ${transaction.category},
      amount = ${transaction.amount},
      description = ${transaction.description},
      payment_method = ${transaction.paymentMethod},
      spent_by = ${transaction.spentBy ?? ''},
      payee_name = ${transaction.payeeName ?? ''},
      purpose = ${transaction.purpose ?? ''},
      notes = ${transaction.notes ?? ''},
      created_at = ${transaction.createdAt.toISOString()}
    WHERE id = ${transaction.id}
    RETURNING
      id,
      transaction_date AS date,
      type,
      category,
      amount::float8 AS amount,
      description,
      payment_method AS "paymentMethod",
      spent_by AS "spentBy",
      payee_name AS "payeeName",
      purpose,
      notes,
      created_at AS "createdAt"
  `) as TransactionInput[];

  return rows[0] ? mapTransaction(rows[0]) : null;
}

export async function deleteTransaction(id: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM transactions
    WHERE id = ${id}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function replaceAllData(input: {
  sales: SaleInput[];
  transactions: TransactionInput[];
}) {
  const sales = input.sales.map(sale => saleSchema.parse(sale));
  const transactions = input.transactions.map(transaction => transactionSchema.parse(transaction));
  await ensureSchema();
  const sql = getSql();

  await sql.transaction((txn) => [
    txn`DELETE FROM transactions`,
    txn`DELETE FROM sales`,
    ...sales.map((sale) => txn`
      INSERT INTO sales (
        id,
        sale_date,
        square_sales,
        cash_collected,
        cash_holder,
        notes,
        created_at
      )
      VALUES (
        ${sale.id},
        ${toDateOnly(sale.date)},
        ${sale.squareSales},
        ${sale.cashCollected},
        ${sale.cashHolder},
        ${sale.notes ?? ''},
        ${sale.createdAt.toISOString()}
      )
    `),
    ...transactions.map((transaction) => txn`
      INSERT INTO transactions (
        id,
        transaction_date,
        type,
        category,
        amount,
        description,
        payment_method,
        spent_by,
        payee_name,
        purpose,
        notes,
        created_at
      )
      VALUES (
        ${transaction.id},
        ${toDateOnly(transaction.date)},
        ${transaction.type},
        ${transaction.category},
        ${transaction.amount},
        ${transaction.description},
        ${transaction.paymentMethod},
        ${transaction.spentBy ?? ''},
        ${transaction.payeeName ?? ''},
        ${transaction.purpose ?? ''},
        ${transaction.notes ?? ''},
        ${transaction.createdAt.toISOString()}
      )
    `),
  ]);

  return {
    sales: sales.map(mapSale),
    transactions: transactions.map(mapTransaction),
  };
}
