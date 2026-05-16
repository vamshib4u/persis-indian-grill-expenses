import { createHash } from 'crypto';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import {
  AppUser,
  CashHolderAdminConfig,
  CashHolderConfig,
  CateringOrder,
  DailySales,
  IngredientPrice,
  MenuIngredient,
  MenuItemCost,
  OperatingCost,
  Restaurant,
  Transaction,
  UserRole,
} from '@/types';

const DEFAULT_PRIMARY_RESTAURANT = {
  id: 'restaurant-1',
  name: 'Ballwin',
  slug: 'ballwin',
};

const DEFAULT_SECONDARY_RESTAURANT = {
  id: 'restaurant-2',
  name: "O'Fallon",
  slug: 'ofallon',
};

const DEFAULT_PRIMARY_CASH_HOLDERS = ['Vamshi', 'Raghu', 'Naresh', 'Nikki', 'Meenu', 'Pradeep'];

const saleSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  date: z.coerce.date(),
  squareSales: z.coerce.number().finite(),
  cashCollected: z.coerce.number().finite(),
  cashHolder: z.string().min(1),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

const transactionSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
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

const cateringOrderSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  readyAt: z.coerce.date(),
  fulfillmentType: z.enum(['pickup', 'delivery', 'banquet_hall']),
  depositAmount: z.coerce.number().finite(),
  depositPaidDate: z.coerce.date().optional().nullable(),
  depositCashHolder: z.string().optional().nullable(),
  finalPaymentAmount: z.coerce.number().finite(),
  finalPaymentDate: z.coerce.date().optional().nullable(),
  finalPaymentCashHolder: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

const restaurantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  createdAt: z.coerce.date(),
});

const cashHolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  startingAmount: z.coerce.number().finite(),
  active: z.coerce.boolean(),
  createdAt: z.coerce.date(),
});

const cashHolderAdminSchema = cashHolderSchema.extend({
  visibleRestaurantIds: z.array(z.string().min(1)),
  startingAmountsByRestaurant: z.record(z.string(), z.coerce.number().finite()),
});

const userSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  passwordHash: z.string().min(1),
  role: z.enum(['restaurant_admin', 'super_admin']),
  restaurantIds: z.array(z.string().min(1)).default([]),
  active: z.coerce.boolean(),
  createdAt: z.coerce.date(),
});

const ingredientPriceSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  name: z.string().min(1),
  itemCode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  packageQuantity: z.coerce.number().positive(),
  packageUnit: z.string().min(1),
  packagePrice: z.coerce.number().nonnegative(),
  priceDate: z.coerce.date(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

const operatingCostSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  costType: z.enum(['employee', 'utility', 'rent', 'packaging', 'gas', 'electricity', 'other']),
  name: z.string().min(1),
  designation: z.string().optional().nullable(),
  amount: z.coerce.number().nonnegative(),
  payCycle: z.enum(['hourly', 'weekly', 'biweekly', 'monthly', 'one_time']),
  hoursPerCycle: z.coerce.number().nonnegative(),
  monthlyAmount: z.coerce.number().nonnegative(),
  effectiveDate: z.coerce.date(),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

const menuIngredientSchema = z.object({
  ingredientName: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
});

const menuItemCostSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  servingSize: z.coerce.number().positive(),
  servingUnit: z.string().min(1),
  salePrice: z.coerce.number().nonnegative(),
  gasCost: z.coerce.number().nonnegative(),
  electricityCost: z.coerce.number().nonnegative(),
  packagingCost: z.coerce.number().nonnegative(),
  laborCost: z.coerce.number().nonnegative(),
  otherCost: z.coerce.number().nonnegative(),
  ingredients: z.array(menuIngredientSchema),
  createdAt: z.coerce.date(),
});

type SaleInput = z.input<typeof saleSchema>;
type TransactionInput = z.input<typeof transactionSchema>;
type CateringOrderInput = z.input<typeof cateringOrderSchema>;
type RestaurantInput = z.input<typeof restaurantSchema>;
type CashHolderInput = z.input<typeof cashHolderSchema>;
type CashHolderAdminInput = z.input<typeof cashHolderAdminSchema>;
type UserInput = z.input<typeof userSchema>;
type IngredientPriceInput = z.input<typeof ingredientPriceSchema>;
type OperatingCostInput = z.input<typeof operatingCostSchema>;
type MenuItemCostInput = z.input<typeof menuItemCostSchema>;

declare global {
  var __persisSchemaReady: Promise<void> | undefined;
  var __persisOperatingCostConstraintReady: Promise<void> | undefined;
}

const getSql = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(databaseUrl);
};

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');
const toDateOnly = (value: unknown) => {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return date.toISOString().slice(0, 10);
};
const toBoolean = (value: unknown) => value === true || value === 'true' || value === 't' || value === 1;

const syncSeedUser = async (
  sql: ReturnType<typeof getSql>,
  input: {
    seedId: string;
    username: string;
    password: string;
    role: UserRole;
    restaurantIds: string[];
  }
) => {
  const passwordHash = hashPassword(input.password);
  const matchingUsers = (await sql`
    SELECT id, username
    FROM users
    WHERE id = ${input.seedId}
       OR username = ${input.username}
    ORDER BY
      CASE WHEN username = ${input.username} THEN 0 ELSE 1 END,
      CASE WHEN id = ${input.seedId} THEN 0 ELSE 1 END,
      id ASC
  `) as Array<{ id: string; username: string }>;

  const canonicalId = matchingUsers[0]?.id || input.seedId;

  if (matchingUsers.length === 0) {
    await sql`
      INSERT INTO users (id, username, password_hash, role, restaurant_id, active)
      VALUES (
        ${canonicalId},
        ${input.username},
        ${passwordHash},
        ${input.role},
        ${input.role === 'super_admin' ? null : input.restaurantIds[0] ?? null},
        TRUE
      )
    `;
  } else {
    for (const user of matchingUsers.slice(1)) {
      await sql`DELETE FROM user_restaurants WHERE user_id = ${user.id}`;
      await sql`DELETE FROM users WHERE id = ${user.id}`;
    }

    await sql`
      UPDATE users
      SET
        username = ${input.username},
        password_hash = ${passwordHash},
        role = ${input.role},
        restaurant_id = ${input.role === 'super_admin' ? null : input.restaurantIds[0] ?? null},
        active = TRUE
      WHERE id = ${canonicalId}
    `;
  }

  await sql`DELETE FROM user_restaurants WHERE user_id = ${canonicalId}`;
  if (input.role !== 'super_admin') {
    for (const restaurantId of input.restaurantIds) {
      await sql`
        INSERT INTO user_restaurants (user_id, restaurant_id)
        VALUES (${canonicalId}, ${restaurantId})
        ON CONFLICT (user_id, restaurant_id) DO NOTHING
      `;
    }
  }
};

const getDefaultRestaurantCredentials = () => {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  if (!username || !password) {
    throw new Error('APP_USERNAME and APP_PASSWORD must be configured');
  }
  return { username, password };
};

const getSuperAdminCredentials = () => ({
  username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
});

const mapSale = (sale: SaleInput): DailySales => {
  const parsed = saleSchema.parse(sale);
  return {
    id: parsed.id,
    restaurantId: parsed.restaurantId,
    date: toDateOnly(sale.date),
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
    restaurantId: parsed.restaurantId,
    date: toDateOnly(transaction.date),
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

const mapCateringOrder = (order: CateringOrderInput): CateringOrder => {
  const parsed = cateringOrderSchema.parse(order);
  return {
    id: parsed.id,
    restaurantId: parsed.restaurantId,
    readyAt: parsed.readyAt.toISOString(),
    fulfillmentType: parsed.fulfillmentType,
    depositAmount: parsed.depositAmount,
    depositPaidDate: parsed.depositPaidDate ? toDateOnly(order.depositPaidDate) : '',
    depositCashHolder: parsed.depositCashHolder ?? '',
    finalPaymentAmount: parsed.finalPaymentAmount,
    finalPaymentDate: parsed.finalPaymentDate ? toDateOnly(order.finalPaymentDate) : '',
    finalPaymentCashHolder: parsed.finalPaymentCashHolder ?? '',
    notes: parsed.notes ?? '',
    createdAt: parsed.createdAt.toISOString(),
  };
};

const mapRestaurant = (restaurant: RestaurantInput): Restaurant => {
  const parsed = restaurantSchema.parse(restaurant);
  return {
    id: parsed.id,
    name: parsed.name,
    slug: parsed.slug,
    createdAt: parsed.createdAt.toISOString(),
  };
};

const mapCashHolder = (cashHolder: CashHolderInput): CashHolderConfig => {
  const parsed = cashHolderSchema.parse({
    ...cashHolder,
    active: toBoolean(cashHolder.active),
  });
  return {
    id: parsed.id,
    name: parsed.name,
    startingAmount: parsed.startingAmount,
    active: parsed.active,
    createdAt: parsed.createdAt.toISOString(),
  };
};

const mapCashHolderAdmin = (cashHolder: CashHolderAdminInput): CashHolderAdminConfig => {
  const parsed = cashHolderAdminSchema.parse({
    ...cashHolder,
    active: toBoolean(cashHolder.active),
  });
  return {
    id: parsed.id,
    name: parsed.name,
    startingAmount: parsed.startingAmount,
    active: parsed.active,
    createdAt: parsed.createdAt.toISOString(),
    visibleRestaurantIds: parsed.visibleRestaurantIds,
    startingAmountsByRestaurant: parsed.startingAmountsByRestaurant,
  };
};

const mapUser = (user: UserInput): AppUser & { passwordHash: string } => {
  const parsed = userSchema.parse({
    ...user,
    active: toBoolean(user.active),
  });
  return {
    id: parsed.id,
    username: parsed.username,
    passwordHash: parsed.passwordHash,
    role: parsed.role,
    restaurantIds: parsed.restaurantIds,
    active: parsed.active,
    createdAt: parsed.createdAt.toISOString(),
  };
};

const withoutPasswordHash = ({ passwordHash, ...user }: AppUser & { passwordHash: string }): AppUser => {
  void passwordHash;
  return user;
};

const mapIngredientPrice = (ingredient: IngredientPriceInput): IngredientPrice => {
  const parsed = ingredientPriceSchema.parse(ingredient);
  return {
    id: parsed.id,
    restaurantId: parsed.restaurantId,
    name: parsed.name,
    itemCode: parsed.itemCode ?? '',
    category: parsed.category ?? '',
    packageQuantity: parsed.packageQuantity,
    packageUnit: parsed.packageUnit,
    packagePrice: parsed.packagePrice,
    priceDate: toDateOnly(ingredient.priceDate),
    source: parsed.source ?? '',
    notes: parsed.notes ?? '',
    createdAt: parsed.createdAt.toISOString(),
  };
};

const mapOperatingCost = (cost: OperatingCostInput): OperatingCost => {
  const parsed = operatingCostSchema.parse(cost);
  return {
    id: parsed.id,
    restaurantId: parsed.restaurantId,
    costType: parsed.costType,
    name: parsed.name,
    designation: parsed.designation ?? '',
    amount: parsed.amount,
    payCycle: parsed.payCycle,
    hoursPerCycle: parsed.hoursPerCycle,
    monthlyAmount: parsed.monthlyAmount,
    effectiveDate: toDateOnly(cost.effectiveDate),
    notes: parsed.notes ?? '',
    createdAt: parsed.createdAt.toISOString(),
  };
};

const normalizeMenuIngredients = (value: unknown): MenuIngredient[] => {
  if (typeof value === 'string') {
    try {
      return z.array(menuIngredientSchema).parse(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return z.array(menuIngredientSchema).parse(value ?? []);
};

const mapMenuItemCost = (item: MenuItemCostInput): MenuItemCost => {
  const parsed = menuItemCostSchema.parse({
    ...item,
    ingredients: normalizeMenuIngredients(item.ingredients),
  });
  return {
    id: parsed.id,
    restaurantId: parsed.restaurantId,
    name: parsed.name,
    description: parsed.description,
    servingSize: parsed.servingSize,
    servingUnit: parsed.servingUnit,
    salePrice: parsed.salePrice,
    gasCost: parsed.gasCost,
    electricityCost: parsed.electricityCost,
    packagingCost: parsed.packagingCost,
    laborCost: parsed.laborCost,
    otherCost: parsed.otherCost,
    ingredients: parsed.ingredients,
    createdAt: parsed.createdAt.toISOString(),
  };
};

const ensureOperatingCostTypeConstraint = async () => {
  if (!globalThis.__persisOperatingCostConstraintReady) {
    globalThis.__persisOperatingCostConstraintReady = (async () => {
      const sql = getSql();
      await sql`ALTER TABLE operating_costs DROP CONSTRAINT IF EXISTS operating_costs_cost_type_check`;
      await sql`
        ALTER TABLE operating_costs
        ADD CONSTRAINT operating_costs_cost_type_check
        CHECK (cost_type IN ('employee', 'utility', 'rent', 'packaging', 'gas', 'electricity', 'other'))
      `;
    })();
  }

  return globalThis.__persisOperatingCostConstraintReady;
};

export async function ensureSchema() {
  if (!globalThis.__persisSchemaReady) {
    globalThis.__persisSchemaReady = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS restaurants (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('restaurant_admin', 'super_admin')),
          restaurant_id TEXT,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS cash_holders (
          id TEXT PRIMARY KEY,
          restaurant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          starting_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (restaurant_id, name)
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS user_restaurants (
          user_id TEXT NOT NULL,
          restaurant_id TEXT NOT NULL,
          PRIMARY KEY (user_id, restaurant_id)
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS cash_holder_profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS cash_holder_restaurants (
          cash_holder_id TEXT NOT NULL,
          restaurant_id TEXT NOT NULL,
          starting_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          visible BOOLEAN NOT NULL DEFAULT TRUE,
          PRIMARY KEY (cash_holder_id, restaurant_id)
        )
      `;

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

      await sql`
        CREATE TABLE IF NOT EXISTS catering_orders (
          id TEXT PRIMARY KEY,
          ready_at TIMESTAMPTZ NOT NULL,
          fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('pickup', 'delivery', 'banquet_hall')),
          deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          deposit_paid_date TIMESTAMPTZ,
          deposit_cash_holder TEXT,
          final_payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          final_payment_date TIMESTAMPTZ,
          final_payment_cash_holder TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS ingredient_prices (
          id TEXT PRIMARY KEY,
          restaurant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          item_code TEXT,
          category TEXT,
          package_quantity NUMERIC(12, 4) NOT NULL,
          package_unit TEXT NOT NULL,
          package_price NUMERIC(12, 2) NOT NULL,
          price_date DATE NOT NULL,
          source TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS operating_costs (
          id TEXT PRIMARY KEY,
          restaurant_id TEXT NOT NULL,
          cost_type TEXT NOT NULL CHECK (cost_type IN ('employee', 'utility', 'rent', 'packaging', 'gas', 'electricity', 'other')),
          name TEXT NOT NULL,
          designation TEXT,
          amount NUMERIC(12, 2) NOT NULL,
          pay_cycle TEXT NOT NULL CHECK (pay_cycle IN ('hourly', 'weekly', 'biweekly', 'monthly', 'one_time')),
          hours_per_cycle NUMERIC(12, 2) NOT NULL DEFAULT 0,
          monthly_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          effective_date DATE NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`ALTER TABLE operating_costs DROP CONSTRAINT IF EXISTS operating_costs_cost_type_check`;
      await sql`
        ALTER TABLE operating_costs
        ADD CONSTRAINT operating_costs_cost_type_check
        CHECK (cost_type IN ('employee', 'utility', 'rent', 'packaging', 'gas', 'electricity', 'other'))
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS menu_item_costs (
          id TEXT PRIMARY KEY,
          restaurant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          serving_size NUMERIC(12, 4) NOT NULL,
          serving_unit TEXT NOT NULL,
          sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
          gas_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
          electricity_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
          packaging_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
          labor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
          other_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
          ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS restaurant_id TEXT`;
      await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS restaurant_id TEXT`;
      await sql`ALTER TABLE catering_orders ADD COLUMN IF NOT EXISTS restaurant_id TEXT`;

      await sql`
        INSERT INTO restaurants (id, name, slug)
        VALUES
          (${DEFAULT_PRIMARY_RESTAURANT.id}, ${DEFAULT_PRIMARY_RESTAURANT.name}, ${DEFAULT_PRIMARY_RESTAURANT.slug}),
          (${DEFAULT_SECONDARY_RESTAURANT.id}, ${DEFAULT_SECONDARY_RESTAURANT.name}, ${DEFAULT_SECONDARY_RESTAURANT.slug})
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            slug = EXCLUDED.slug
      `;

      await sql`
        UPDATE sales
        SET restaurant_id = ${DEFAULT_PRIMARY_RESTAURANT.id}
        WHERE restaurant_id IS NULL OR restaurant_id = ''
      `;
      await sql`
        UPDATE transactions
        SET restaurant_id = ${DEFAULT_PRIMARY_RESTAURANT.id}
        WHERE restaurant_id IS NULL OR restaurant_id = ''
      `;
      await sql`
        UPDATE catering_orders
        SET restaurant_id = ${DEFAULT_PRIMARY_RESTAURANT.id}
        WHERE restaurant_id IS NULL OR restaurant_id = ''
      `;

      await sql`
        INSERT INTO user_restaurants (user_id, restaurant_id)
        SELECT id, restaurant_id
        FROM users
        WHERE restaurant_id IS NOT NULL AND restaurant_id <> ''
        ON CONFLICT (user_id, restaurant_id) DO NOTHING
      `;

      await sql`ALTER TABLE sales ALTER COLUMN restaurant_id SET NOT NULL`;
      await sql`ALTER TABLE transactions ALTER COLUMN restaurant_id SET NOT NULL`;
      await sql`ALTER TABLE catering_orders ALTER COLUMN restaurant_id SET NOT NULL`;

      const restaurantUser = getDefaultRestaurantCredentials();
      const superAdmin = getSuperAdminCredentials();

      await syncSeedUser(sql, {
        seedId: 'user-restaurant-admin',
        username: restaurantUser.username,
        password: restaurantUser.password,
        role: 'restaurant_admin',
        restaurantIds: [DEFAULT_PRIMARY_RESTAURANT.id],
      });

      await syncSeedUser(sql, {
        seedId: 'user-super-admin',
        username: superAdmin.username,
        password: superAdmin.password,
        role: 'super_admin',
        restaurantIds: [],
      });

      await sql`
        INSERT INTO cash_holder_profiles (id, name, active, created_at)
        SELECT
          MIN(id) AS id,
          name,
          BOOL_OR(active) AS active,
          MIN(created_at) AS created_at
        FROM cash_holders
        GROUP BY name
        ON CONFLICT (name) DO UPDATE
        SET active = EXCLUDED.active
      `;

      await sql`
        INSERT INTO cash_holder_restaurants (cash_holder_id, restaurant_id, starting_amount, visible)
        SELECT
          profiles.id,
          holders.restaurant_id,
          holders.starting_amount,
          holders.active
        FROM cash_holders AS holders
        JOIN cash_holder_profiles AS profiles
          ON profiles.name = holders.name
        ON CONFLICT (cash_holder_id, restaurant_id) DO UPDATE
        SET starting_amount = EXCLUDED.starting_amount,
            visible = EXCLUDED.visible
      `;

      for (const holder of DEFAULT_PRIMARY_CASH_HOLDERS) {
        await sql`
          INSERT INTO cash_holder_profiles (id, name, active)
          VALUES (
            ${`cash-holder-${holder.toLowerCase()}`},
            ${holder},
            TRUE
          )
          ON CONFLICT (name) DO NOTHING
        `;
        await sql`
          INSERT INTO cash_holder_restaurants (cash_holder_id, restaurant_id, starting_amount, visible)
          VALUES (
            ${`cash-holder-${holder.toLowerCase()}`},
            ${DEFAULT_PRIMARY_RESTAURANT.id},
            0,
            TRUE
          )
          ON CONFLICT (cash_holder_id, restaurant_id) DO NOTHING
        `;
      }

      await sql`CREATE INDEX IF NOT EXISTS sales_sale_date_idx ON sales (restaurant_id, sale_date DESC)`;
      await sql`
        CREATE INDEX IF NOT EXISTS transactions_transaction_date_idx
        ON transactions (restaurant_id, transaction_date DESC)
      `;
      await sql`CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions (restaurant_id, type)`;
      await sql`CREATE INDEX IF NOT EXISTS catering_ready_at_idx ON catering_orders (restaurant_id, ready_at DESC)`;
      await sql`
        CREATE INDEX IF NOT EXISTS ingredient_prices_lookup_idx
        ON ingredient_prices (restaurant_id, lower(name), price_date DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS ingredient_prices_code_idx
        ON ingredient_prices (restaurant_id, item_code)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS operating_costs_effective_idx
        ON operating_costs (restaurant_id, cost_type, effective_date DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS menu_item_costs_name_idx
        ON menu_item_costs (restaurant_id, lower(name))
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS user_restaurants_user_idx
        ON user_restaurants (user_id, restaurant_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS cash_holder_restaurants_restaurant_idx
        ON cash_holder_restaurants (restaurant_id, visible)
      `;
    })();
  }

  return globalThis.__persisSchemaReady;
}

export async function listRestaurants(): Promise<Restaurant[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, slug, created_at AS "createdAt"
    FROM restaurants
    ORDER BY created_at ASC, name ASC
  `) as RestaurantInput[];
  return rows.map(mapRestaurant);
}

export async function listCashHolders(restaurantId: string): Promise<CashHolderConfig[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      profiles.id,
      profiles.name,
      assignments.starting_amount::float8 AS "startingAmount",
      profiles.active,
      profiles.created_at AS "createdAt"
    FROM cash_holder_profiles AS profiles
    JOIN cash_holder_restaurants AS assignments
      ON assignments.cash_holder_id = profiles.id
    WHERE assignments.restaurant_id = ${restaurantId}
      AND assignments.visible = TRUE
    ORDER BY profiles.active DESC, profiles.name ASC
  `) as CashHolderInput[];
  return rows.map(mapCashHolder);
}

export async function listCashHoldersForAdmin(): Promise<CashHolderAdminConfig[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      profiles.id,
      profiles.name,
      profiles.active,
      profiles.created_at AS "createdAt",
      COALESCE(
        ARRAY(
          SELECT restaurant_id
          FROM cash_holder_restaurants
          WHERE cash_holder_id = profiles.id
          ORDER BY restaurant_id
        ),
        ARRAY[]::TEXT[]
      ) AS "visibleRestaurantIds",
      COALESCE(
        json_object_agg(assignments.restaurant_id, assignments.starting_amount::float8)
          FILTER (WHERE assignments.restaurant_id IS NOT NULL),
        '{}'::json
      ) AS "startingAmountsByRestaurant",
      COALESCE(MIN(assignments.starting_amount::float8), 0) AS "startingAmount"
    FROM cash_holder_profiles AS profiles
    LEFT JOIN cash_holder_restaurants AS assignments
      ON assignments.cash_holder_id = profiles.id
    GROUP BY profiles.id, profiles.name, profiles.active, profiles.created_at
    ORDER BY profiles.active DESC, profiles.name ASC
  `) as CashHolderAdminInput[];
  return rows.map(mapCashHolderAdmin);
}

export async function createCashHolder(input: {
  id: string;
  name: string;
  restaurantIds: string[];
  startingAmountsByRestaurant: Record<string, number>;
  startingAmount: number;
  active?: boolean;
}) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO cash_holder_profiles (id, name, active)
    VALUES (${input.id}, ${input.name}, ${input.active ?? true})
  `;

  for (const restaurantId of input.restaurantIds) {
    await sql`
      INSERT INTO cash_holder_restaurants (cash_holder_id, restaurant_id, starting_amount, visible)
      VALUES (
        ${input.id},
        ${restaurantId},
        ${input.startingAmountsByRestaurant[restaurantId] ?? input.startingAmount ?? 0},
        TRUE
      )
      ON CONFLICT (cash_holder_id, restaurant_id) DO UPDATE
      SET starting_amount = EXCLUDED.starting_amount,
          visible = TRUE
    `;
  }

  const holders = await listCashHoldersForAdmin();
  return holders.find((holder) => holder.id === input.id) ?? null;
}

export async function updateCashHolder(input: {
  id: string;
  name: string;
  restaurantIds: string[];
  startingAmountsByRestaurant: Record<string, number>;
  active: boolean;
}) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE cash_holder_profiles
    SET
      name = ${input.name},
      active = ${input.active}
    WHERE id = ${input.id}
  `;

  await sql`
    DELETE FROM cash_holder_restaurants
    WHERE cash_holder_id = ${input.id}
      AND restaurant_id <> ALL(${input.restaurantIds})
  `;

  for (const restaurantId of input.restaurantIds) {
    await sql`
      INSERT INTO cash_holder_restaurants (cash_holder_id, restaurant_id, starting_amount, visible)
      VALUES (
        ${input.id},
        ${restaurantId},
        ${input.startingAmountsByRestaurant[restaurantId] ?? 0},
        TRUE
      )
      ON CONFLICT (cash_holder_id, restaurant_id) DO UPDATE
      SET starting_amount = EXCLUDED.starting_amount,
          visible = TRUE
    `;
  }

  const holders = await listCashHoldersForAdmin();
  return holders.find((holder) => holder.id === input.id) ?? null;
}

export async function getUserById(id: string) {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      username,
      password_hash AS "passwordHash",
      role,
      COALESCE(
        ARRAY(
          SELECT restaurant_id
          FROM user_restaurants
          WHERE user_id = users.id
          ORDER BY restaurant_id
        ),
        ARRAY[]::TEXT[]
      ) AS "restaurantIds",
      active,
      created_at AS "createdAt"
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as UserInput[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserByUsername(username: string) {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      username,
      password_hash AS "passwordHash",
      role,
      COALESCE(
        ARRAY(
          SELECT restaurant_id
          FROM user_restaurants
          WHERE user_id = users.id
          ORDER BY restaurant_id
        ),
        ARRAY[]::TEXT[]
      ) AS "restaurantIds",
      active,
      created_at AS "createdAt"
    FROM users
    WHERE username = ${username}
    LIMIT 1
  `) as UserInput[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function listUsers(): Promise<AppUser[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      username,
      password_hash AS "passwordHash",
      role,
      COALESCE(
        ARRAY(
          SELECT restaurant_id
          FROM user_restaurants
          WHERE user_id = users.id
          ORDER BY restaurant_id
        ),
        ARRAY[]::TEXT[]
      ) AS "restaurantIds",
      active,
      created_at AS "createdAt"
    FROM users
    ORDER BY username ASC
  `) as UserInput[];
  return rows.map(mapUser).map(withoutPasswordHash);
}

export async function createUser(input: {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  restaurantIds?: string[];
  active?: boolean;
}) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO users (id, username, password_hash, role, restaurant_id, active)
    VALUES (
      ${input.id},
      ${input.username},
      ${hashPassword(input.password)},
      ${input.role},
      ${input.role === 'super_admin' ? null : input.restaurantIds?.[0] ?? null},
      ${input.active ?? true}
    )
    RETURNING
      id,
      username,
      password_hash AS "passwordHash",
      role,
      ARRAY[]::TEXT[] AS "restaurantIds",
      active,
      created_at AS "createdAt"
  `;
  if (input.role !== 'super_admin') {
    for (const restaurantId of input.restaurantIds ?? []) {
      await sql`
        INSERT INTO user_restaurants (user_id, restaurant_id)
        VALUES (${input.id}, ${restaurantId})
        ON CONFLICT (user_id, restaurant_id) DO NOTHING
      `;
    }
  }
  const created = await getUserById(input.id);
  if (!created) {
    throw new Error('Failed to load created user');
  }
  return withoutPasswordHash(created);
}

export async function updateUser(input: {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  restaurantIds?: string[];
  active: boolean;
}) {
  await ensureSchema();
  const sql = getSql();
  const existing = await getUserById(input.id);
  if (!existing) return null;

  const passwordHash = input.password ? hashPassword(input.password) : existing.passwordHash;
  const rows = (await sql`
    UPDATE users
    SET
      username = ${input.username},
      password_hash = ${passwordHash},
      role = ${input.role},
      restaurant_id = ${input.role === 'super_admin' ? null : input.restaurantIds?.[0] ?? null},
      active = ${input.active}
    WHERE id = ${input.id}
    RETURNING
      id,
      username,
      password_hash AS "passwordHash",
      role,
      ARRAY[]::TEXT[] AS "restaurantIds",
      active,
      created_at AS "createdAt"
  `) as UserInput[];

  if (!rows[0]) return null;
  await sql`DELETE FROM user_restaurants WHERE user_id = ${input.id}`;
  if (input.role !== 'super_admin') {
    for (const restaurantId of input.restaurantIds ?? []) {
      await sql`
        INSERT INTO user_restaurants (user_id, restaurant_id)
        VALUES (${input.id}, ${restaurantId})
      `;
    }
  }

  const updated = await getUserById(input.id);
  if (!updated) return null;
  return withoutPasswordHash(updated);
}

export async function listSales(restaurantId: string): Promise<DailySales[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      restaurant_id AS "restaurantId",
      sale_date AS date,
      square_sales::float8 AS "squareSales",
      cash_collected::float8 AS "cashCollected",
      cash_holder AS "cashHolder",
      notes,
      created_at AS "createdAt"
    FROM sales
    WHERE restaurant_id = ${restaurantId}
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
      restaurant_id,
      sale_date,
      square_sales,
      cash_collected,
      cash_holder,
      notes,
      created_at
    )
    VALUES (
      ${sale.id},
      ${sale.restaurantId},
      ${toDateOnly(sale.date)},
      ${sale.squareSales},
      ${sale.cashCollected},
      ${sale.cashHolder},
      ${sale.notes ?? ''},
      ${sale.createdAt.toISOString()}
    )
    RETURNING
      id,
      restaurant_id AS "restaurantId",
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
    WHERE id = ${sale.id} AND restaurant_id = ${sale.restaurantId}
    RETURNING
      id,
      restaurant_id AS "restaurantId",
      sale_date AS date,
      square_sales::float8 AS "squareSales",
      cash_collected::float8 AS "cashCollected",
      cash_holder AS "cashHolder",
      notes,
      created_at AS "createdAt"
  `) as SaleInput[];

  return rows[0] ? mapSale(rows[0]) : null;
}

export async function deleteSale(id: string, restaurantId: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM sales
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function listTransactions(restaurantId: string): Promise<Transaction[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      restaurant_id AS "restaurantId",
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
    WHERE restaurant_id = ${restaurantId}
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
      restaurant_id,
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
      ${transaction.restaurantId},
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
      restaurant_id AS "restaurantId",
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
    WHERE id = ${transaction.id} AND restaurant_id = ${transaction.restaurantId}
    RETURNING
      id,
      restaurant_id AS "restaurantId",
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

export async function deleteTransaction(id: string, restaurantId: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM transactions
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function listIngredientPrices(restaurantId: string): Promise<IngredientPrice[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      restaurant_id AS "restaurantId",
      name,
      item_code AS "itemCode",
      category,
      package_quantity::float8 AS "packageQuantity",
      package_unit AS "packageUnit",
      package_price::float8 AS "packagePrice",
      price_date AS "priceDate",
      source,
      notes,
      created_at AS "createdAt"
    FROM ingredient_prices
    WHERE restaurant_id = ${restaurantId}
    ORDER BY price_date DESC, lower(name) ASC, created_at DESC
  `) as IngredientPriceInput[];

  return rows.map(mapIngredientPrice);
}

export async function upsertIngredientPrice(input: IngredientPriceInput): Promise<IngredientPrice> {
  const ingredient = ingredientPriceSchema.parse(input);
  await ensureSchema();
  const sql = getSql();

  const [row] = (await sql`
    INSERT INTO ingredient_prices (
      id,
      restaurant_id,
      name,
      item_code,
      category,
      package_quantity,
      package_unit,
      package_price,
      price_date,
      source,
      notes,
      created_at
    )
    VALUES (
      ${ingredient.id},
      ${ingredient.restaurantId},
      ${ingredient.name},
      ${ingredient.itemCode ?? ''},
      ${ingredient.category ?? ''},
      ${ingredient.packageQuantity},
      ${ingredient.packageUnit},
      ${ingredient.packagePrice},
      ${toDateOnly(ingredient.priceDate)},
      ${ingredient.source ?? ''},
      ${ingredient.notes ?? ''},
      ${ingredient.createdAt.toISOString()}
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      item_code = EXCLUDED.item_code,
      category = EXCLUDED.category,
      package_quantity = EXCLUDED.package_quantity,
      package_unit = EXCLUDED.package_unit,
      package_price = EXCLUDED.package_price,
      price_date = EXCLUDED.price_date,
      source = EXCLUDED.source,
      notes = EXCLUDED.notes
    RETURNING
      id,
      restaurant_id AS "restaurantId",
      name,
      item_code AS "itemCode",
      category,
      package_quantity::float8 AS "packageQuantity",
      package_unit AS "packageUnit",
      package_price::float8 AS "packagePrice",
      price_date AS "priceDate",
      source,
      notes,
      created_at AS "createdAt"
  `) as IngredientPriceInput[];

  return mapIngredientPrice(row);
}

export async function deleteIngredientPrice(id: string, restaurantId: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM ingredient_prices
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function listOperatingCosts(restaurantId: string): Promise<OperatingCost[]> {
  await ensureSchema();
  await ensureOperatingCostTypeConstraint();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      restaurant_id AS "restaurantId",
      cost_type AS "costType",
      name,
      designation,
      amount::float8 AS amount,
      pay_cycle AS "payCycle",
      hours_per_cycle::float8 AS "hoursPerCycle",
      monthly_amount::float8 AS "monthlyAmount",
      effective_date AS "effectiveDate",
      notes,
      created_at AS "createdAt"
    FROM operating_costs
    WHERE restaurant_id = ${restaurantId}
    ORDER BY effective_date DESC, cost_type ASC, name ASC
  `) as OperatingCostInput[];

  return rows.map(mapOperatingCost);
}

export async function upsertOperatingCost(input: OperatingCostInput): Promise<OperatingCost> {
  const cost = operatingCostSchema.parse(input);
  await ensureSchema();
  await ensureOperatingCostTypeConstraint();
  const sql = getSql();

  const [row] = (await sql`
    INSERT INTO operating_costs (
      id,
      restaurant_id,
      cost_type,
      name,
      designation,
      amount,
      pay_cycle,
      hours_per_cycle,
      monthly_amount,
      effective_date,
      notes,
      created_at
    )
    VALUES (
      ${cost.id},
      ${cost.restaurantId},
      ${cost.costType},
      ${cost.name},
      ${cost.designation ?? ''},
      ${cost.amount},
      ${cost.payCycle},
      ${cost.hoursPerCycle},
      ${cost.monthlyAmount},
      ${toDateOnly(cost.effectiveDate)},
      ${cost.notes ?? ''},
      ${cost.createdAt.toISOString()}
    )
    ON CONFLICT (id) DO UPDATE
    SET
      cost_type = EXCLUDED.cost_type,
      name = EXCLUDED.name,
      designation = EXCLUDED.designation,
      amount = EXCLUDED.amount,
      pay_cycle = EXCLUDED.pay_cycle,
      hours_per_cycle = EXCLUDED.hours_per_cycle,
      monthly_amount = EXCLUDED.monthly_amount,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes
    RETURNING
      id,
      restaurant_id AS "restaurantId",
      cost_type AS "costType",
      name,
      designation,
      amount::float8 AS amount,
      pay_cycle AS "payCycle",
      hours_per_cycle::float8 AS "hoursPerCycle",
      monthly_amount::float8 AS "monthlyAmount",
      effective_date AS "effectiveDate",
      notes,
      created_at AS "createdAt"
  `) as OperatingCostInput[];

  return mapOperatingCost(row);
}

export async function deleteOperatingCost(id: string, restaurantId: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM operating_costs
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function listMenuItemCosts(restaurantId: string): Promise<MenuItemCost[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      restaurant_id AS "restaurantId",
      name,
      description,
      serving_size::float8 AS "servingSize",
      serving_unit AS "servingUnit",
      sale_price::float8 AS "salePrice",
      gas_cost::float8 AS "gasCost",
      electricity_cost::float8 AS "electricityCost",
      packaging_cost::float8 AS "packagingCost",
      labor_cost::float8 AS "laborCost",
      other_cost::float8 AS "otherCost",
      ingredients,
      created_at AS "createdAt"
    FROM menu_item_costs
    WHERE restaurant_id = ${restaurantId}
    ORDER BY lower(name) ASC
  `) as MenuItemCostInput[];

  return rows.map(mapMenuItemCost);
}

export async function upsertMenuItemCost(input: MenuItemCostInput): Promise<MenuItemCost> {
  const item = menuItemCostSchema.parse({
    ...input,
    ingredients: normalizeMenuIngredients(input.ingredients),
  });
  await ensureSchema();
  const sql = getSql();
  const ingredientsJson = JSON.stringify(item.ingredients);

  const [row] = (await sql`
    INSERT INTO menu_item_costs (
      id,
      restaurant_id,
      name,
      description,
      serving_size,
      serving_unit,
      sale_price,
      gas_cost,
      electricity_cost,
      packaging_cost,
      labor_cost,
      other_cost,
      ingredients,
      created_at
    )
    VALUES (
      ${item.id},
      ${item.restaurantId},
      ${item.name},
      ${item.description},
      ${item.servingSize},
      ${item.servingUnit},
      ${item.salePrice},
      ${item.gasCost},
      ${item.electricityCost},
      ${item.packagingCost},
      ${item.laborCost},
      ${item.otherCost},
      ${ingredientsJson}::jsonb,
      ${item.createdAt.toISOString()}
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      serving_size = EXCLUDED.serving_size,
      serving_unit = EXCLUDED.serving_unit,
      sale_price = EXCLUDED.sale_price,
      gas_cost = EXCLUDED.gas_cost,
      electricity_cost = EXCLUDED.electricity_cost,
      packaging_cost = EXCLUDED.packaging_cost,
      labor_cost = EXCLUDED.labor_cost,
      other_cost = EXCLUDED.other_cost,
      ingredients = EXCLUDED.ingredients
    RETURNING
      id,
      restaurant_id AS "restaurantId",
      name,
      description,
      serving_size::float8 AS "servingSize",
      serving_unit AS "servingUnit",
      sale_price::float8 AS "salePrice",
      gas_cost::float8 AS "gasCost",
      electricity_cost::float8 AS "electricityCost",
      packaging_cost::float8 AS "packagingCost",
      labor_cost::float8 AS "laborCost",
      other_cost::float8 AS "otherCost",
      ingredients,
      created_at AS "createdAt"
  `) as MenuItemCostInput[];

  return mapMenuItemCost(row);
}

export async function deleteMenuItemCost(id: string, restaurantId: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM menu_item_costs
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function listCateringOrders(restaurantId: string): Promise<CateringOrder[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      restaurant_id AS "restaurantId",
      ready_at AS "readyAt",
      fulfillment_type AS "fulfillmentType",
      deposit_amount::float8 AS "depositAmount",
      deposit_paid_date AS "depositPaidDate",
      deposit_cash_holder AS "depositCashHolder",
      final_payment_amount::float8 AS "finalPaymentAmount",
      final_payment_date AS "finalPaymentDate",
      final_payment_cash_holder AS "finalPaymentCashHolder",
      notes,
      created_at AS "createdAt"
    FROM catering_orders
    WHERE restaurant_id = ${restaurantId}
    ORDER BY ready_at ASC, created_at ASC
  `) as CateringOrderInput[];

  return rows.map(mapCateringOrder);
}

export async function createCateringOrder(input: CateringOrderInput): Promise<CateringOrder> {
  const order = cateringOrderSchema.parse(input);
  await ensureSchema();
  const sql = getSql();

  const [row] = (await sql`
    INSERT INTO catering_orders (
      id,
      restaurant_id,
      ready_at,
      fulfillment_type,
      deposit_amount,
      deposit_paid_date,
      deposit_cash_holder,
      final_payment_amount,
      final_payment_date,
      final_payment_cash_holder,
      notes,
      created_at
    )
    VALUES (
      ${order.id},
      ${order.restaurantId},
      ${order.readyAt.toISOString()},
      ${order.fulfillmentType},
      ${order.depositAmount},
      ${order.depositPaidDate ? order.depositPaidDate.toISOString() : null},
      ${order.depositCashHolder ?? ''},
      ${order.finalPaymentAmount},
      ${order.finalPaymentDate ? order.finalPaymentDate.toISOString() : null},
      ${order.finalPaymentCashHolder ?? ''},
      ${order.notes ?? ''},
      ${order.createdAt.toISOString()}
    )
    RETURNING
      id,
      restaurant_id AS "restaurantId",
      ready_at AS "readyAt",
      fulfillment_type AS "fulfillmentType",
      deposit_amount::float8 AS "depositAmount",
      deposit_paid_date AS "depositPaidDate",
      deposit_cash_holder AS "depositCashHolder",
      final_payment_amount::float8 AS "finalPaymentAmount",
      final_payment_date AS "finalPaymentDate",
      final_payment_cash_holder AS "finalPaymentCashHolder",
      notes,
      created_at AS "createdAt"
  `) as CateringOrderInput[];

  return mapCateringOrder(row);
}

export async function updateCateringOrder(input: CateringOrderInput): Promise<CateringOrder | null> {
  const order = cateringOrderSchema.parse(input);
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    UPDATE catering_orders
    SET
      ready_at = ${order.readyAt.toISOString()},
      fulfillment_type = ${order.fulfillmentType},
      deposit_amount = ${order.depositAmount},
      deposit_paid_date = ${order.depositPaidDate ? order.depositPaidDate.toISOString() : null},
      deposit_cash_holder = ${order.depositCashHolder ?? ''},
      final_payment_amount = ${order.finalPaymentAmount},
      final_payment_date = ${order.finalPaymentDate ? order.finalPaymentDate.toISOString() : null},
      final_payment_cash_holder = ${order.finalPaymentCashHolder ?? ''},
      notes = ${order.notes ?? ''},
      created_at = ${order.createdAt.toISOString()}
    WHERE id = ${order.id} AND restaurant_id = ${order.restaurantId}
    RETURNING
      id,
      restaurant_id AS "restaurantId",
      ready_at AS "readyAt",
      fulfillment_type AS "fulfillmentType",
      deposit_amount::float8 AS "depositAmount",
      deposit_paid_date AS "depositPaidDate",
      deposit_cash_holder AS "depositCashHolder",
      final_payment_amount::float8 AS "finalPaymentAmount",
      final_payment_date AS "finalPaymentDate",
      final_payment_cash_holder AS "finalPaymentCashHolder",
      notes,
      created_at AS "createdAt"
  `) as CateringOrderInput[];

  return rows[0] ? mapCateringOrder(rows[0]) : null;
}

export async function deleteCateringOrder(id: string, restaurantId: string) {
  await ensureSchema();
  const sql = getSql();
  const result = (await sql`
    DELETE FROM catering_orders
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

export async function replaceRestaurantData(input: {
  restaurantId: string;
  sales: SaleInput[];
  transactions: TransactionInput[];
  cateringOrders: CateringOrderInput[];
}) {
  const sales = input.sales.map((sale) => saleSchema.parse({ ...sale, restaurantId: input.restaurantId }));
  const transactions = input.transactions.map((transaction) =>
    transactionSchema.parse({ ...transaction, restaurantId: input.restaurantId })
  );
  const cateringOrders = input.cateringOrders.map((order) =>
    cateringOrderSchema.parse({ ...order, restaurantId: input.restaurantId })
  );
  await ensureSchema();
  const sql = getSql();

  await sql.transaction((txn) => [
    txn`DELETE FROM sales WHERE restaurant_id = ${input.restaurantId}`,
    txn`DELETE FROM transactions WHERE restaurant_id = ${input.restaurantId}`,
    txn`DELETE FROM catering_orders WHERE restaurant_id = ${input.restaurantId}`,
    ...sales.map((sale) => txn`
      INSERT INTO sales (
        id,
        restaurant_id,
        sale_date,
        square_sales,
        cash_collected,
        cash_holder,
        notes,
        created_at
      )
      VALUES (
        ${sale.id},
        ${sale.restaurantId},
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
        restaurant_id,
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
        ${transaction.restaurantId},
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
    ...cateringOrders.map((order) => txn`
      INSERT INTO catering_orders (
        id,
        restaurant_id,
        ready_at,
        fulfillment_type,
        deposit_amount,
        deposit_paid_date,
        deposit_cash_holder,
        final_payment_amount,
        final_payment_date,
        final_payment_cash_holder,
        notes,
        created_at
      )
      VALUES (
        ${order.id},
        ${order.restaurantId},
        ${order.readyAt.toISOString()},
        ${order.fulfillmentType},
        ${order.depositAmount},
        ${order.depositPaidDate ? order.depositPaidDate.toISOString() : null},
        ${order.depositCashHolder ?? ''},
        ${order.finalPaymentAmount},
        ${order.finalPaymentDate ? order.finalPaymentDate.toISOString() : null},
        ${order.finalPaymentCashHolder ?? ''},
        ${order.notes ?? ''},
        ${order.createdAt.toISOString()}
      )
    `),
  ]);

  const [nextSales, nextTransactions, nextCateringOrders] = await Promise.all([
    listSales(input.restaurantId),
    listTransactions(input.restaurantId),
    listCateringOrders(input.restaurantId),
  ]);

  return {
    sales: nextSales,
    transactions: nextTransactions,
    cateringOrders: nextCateringOrders,
  };
}
