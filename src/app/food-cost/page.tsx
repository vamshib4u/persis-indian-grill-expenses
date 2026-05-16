'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  FoodCostRecordType,
  IngredientPrice,
  MenuIngredient,
  MenuItemCost,
  OperatingCost,
  OperatingCostType,
  PayCycle,
} from '@/types';
import { formatCurrency, generateId, toDateInputValue } from '@/lib/utils';

type FoodCostPayload = {
  restaurantId: string;
  ingredientPrices: IngredientPrice[];
  operatingCosts: OperatingCost[];
  menuItems: MenuItemCost[];
};

type IngredientForm = {
  name: string;
  itemCode: string;
  category: string;
  packageQuantity: string;
  packageUnit: string;
  packagePrice: string;
  priceDate: string;
  source: string;
  notes: string;
};

type OperatingCostForm = {
  costType: OperatingCostType;
  name: string;
  designation: string;
  amount: string;
  payCycle: PayCycle;
  hoursPerCycle: string;
  monthlyAmount: string;
  effectiveDate: string;
  notes: string;
};

type MenuItemForm = {
  name: string;
  description: string;
  servingSize: string;
  servingUnit: string;
  salePrice: string;
  gasCost: string;
  electricityCost: string;
  packagingCost: string;
  laborCost: string;
  otherCost: string;
};

type CsvMenuItem = {
  name: string;
  description: string;
  servingSize: number;
  servingUnit: string;
  salePrice: number;
};

const defaultIngredientForm = (): IngredientForm => ({
  name: '',
  itemCode: '',
  category: '',
  packageQuantity: '1',
  packageUnit: 'lb',
  packagePrice: '',
  priceDate: toDateInputValue(),
  source: '',
  notes: '',
});

const defaultOperatingCostForm = (): OperatingCostForm => ({
  costType: 'employee',
  name: '',
  designation: '',
  amount: '',
  payCycle: 'hourly',
  hoursPerCycle: '',
  monthlyAmount: '',
  effectiveDate: toDateInputValue(),
  notes: '',
});

const defaultMenuItemForm = (): MenuItemForm => ({
  name: '',
  description: '',
  servingSize: '16',
  servingUnit: 'oz',
  salePrice: '',
  gasCost: '0',
  electricityCost: '0',
  packagingCost: '0',
  laborCost: '0',
  otherCost: '0',
});

const toNumber = (value: string) => Number(value || '0') || 0;

const monthlyAmount = (form: OperatingCostForm) => {
  const amount = toNumber(form.amount);
  const hours = toNumber(form.hoursPerCycle);
  if (form.payCycle === 'hourly') return amount * hours * 4.33;
  if (form.payCycle === 'weekly') return amount * 4.33;
  if (form.payCycle === 'biweekly') return amount * 2.17;
  if (form.payCycle === 'monthly') return amount;
  return toNumber(form.monthlyAmount) || amount;
};

const unitCost = (ingredient: IngredientPrice) =>
  ingredient.packageQuantity > 0 ? ingredient.packagePrice / ingredient.packageQuantity : 0;

const dailyRunningCostTypes: OperatingCostType[] = ['employee', 'utility', 'rent', 'gas', 'electricity'];

const latestIngredientMap = (ingredients: IngredientPrice[]) => {
  const sorted = [...ingredients].sort((a, b) => String(b.priceDate).localeCompare(String(a.priceDate)));
  return new Map(sorted.map((ingredient) => [ingredient.name.toLowerCase(), ingredient]));
};

const ingredientTrend = (ingredients: IngredientPrice[], ingredient: IngredientPrice) => {
  const matches = ingredients
    .filter((entry) => entry.name.toLowerCase() === ingredient.name.toLowerCase())
    .sort((a, b) => String(b.priceDate).localeCompare(String(a.priceDate)));
  if (matches.length < 2) return 0;
  return matches[0].packagePrice - matches[1].packagePrice;
};

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const parseCsvRows = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

const parseCurrency = (value: string) => Number(value.replace(/[$,]/g, '').trim() || '0') || 0;

const parseServing = (value: string) => {
  const match = value.match(/([\d.]+)\s*([a-zA-Z]+)/);
  return {
    size: match ? Number(match[1]) || 16 : 16,
    unit: match?.[2] || 'oz',
  };
};

const readCsvMenuItems = (text: string): CsvMenuItem[] => {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const valueFor = (row: string[], aliases: string[]) => {
    const index = headers.findIndex((header) => aliases.includes(header));
    return index >= 0 ? row[index] || '' : '';
  };

  return rows
    .slice(1)
    .map((row) => {
      const combinedServing = parseServing(valueFor(row, ['serving', 'size', 'portion', 'portionsize']));
      const explicitServingSize = parseCurrency(valueFor(row, ['servingsize', 'quantity', 'qty', 'ounces', 'oz']));
      return {
        name: valueFor(row, ['name', 'item', 'itemname', 'menuitem', 'product']).trim(),
        description: valueFor(row, ['description', 'desc', 'details']).trim(),
        servingSize: explicitServingSize || combinedServing.size,
        servingUnit: valueFor(row, ['servingunit', 'unit', 'uom']).trim() || combinedServing.unit,
        salePrice: parseCurrency(valueFor(row, ['price', 'saleprice', 'menuprice', 'amount'])),
      };
    })
    .filter((item) => item.name);
};

export default function FoodCostPage() {
  const [payload, setPayload] = useState<FoodCostPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ingredientForm, setIngredientForm] = useState(defaultIngredientForm);
  const [operatingCostForm, setOperatingCostForm] = useState(defaultOperatingCostForm);
  const [menuItemForm, setMenuItemForm] = useState(defaultMenuItemForm);
  const [ingredientDraft, setIngredientDraft] = useState<MenuIngredient>({
    ingredientName: '',
    quantity: 0,
    unit: 'lb',
  });
  const [menuIngredients, setMenuIngredients] = useState<MenuIngredient[]>([]);
  const [csvMenuItems, setCsvMenuItems] = useState<CsvMenuItem[]>([]);
  const [savingCsvMenu, setSavingCsvMenu] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/food-cost', { cache: 'no-store' });
      const nextPayload = await response.json();
      if (!response.ok) throw new Error(nextPayload.error || 'Failed to load food cost data');
      setPayload(nextPayload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load food cost data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const ingredientPrices = useMemo(() => payload?.ingredientPrices || [], [payload?.ingredientPrices]);
  const operatingCosts = useMemo(() => payload?.operatingCosts || [], [payload?.operatingCosts]);
  const menuItems = useMemo(() => payload?.menuItems || [], [payload?.menuItems]);
  const latestIngredients = useMemo(() => latestIngredientMap(ingredientPrices), [ingredientPrices]);
  const visibleMenuItems = menuItems.filter((item) =>
    `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const saveRecord = async (recordType: FoodCostRecordType, body: Record<string, unknown>) => {
    const response = await fetch('/api/food-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordType,
        restaurantId: payload?.restaurantId,
        ...body,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to save record');
  };

  const deleteRecord = async (recordType: FoodCostRecordType, id: string) => {
    const params = new URLSearchParams({
      recordType,
      id,
      restaurantId: payload?.restaurantId || '',
    });
    const response = await fetch(`/api/food-cost?${params.toString()}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to delete record');
    await loadData();
  };

  const handleIngredientSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await saveRecord('ingredient', {
        id: generateId(),
        ...ingredientForm,
        packageQuantity: toNumber(ingredientForm.packageQuantity),
        packagePrice: toNumber(ingredientForm.packagePrice),
        createdAt: new Date(),
      });
      setIngredientForm(defaultIngredientForm());
      toast.success('Ingredient price saved');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save ingredient');
    }
  };

  const handleOperatingCostSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await saveRecord('operating_cost', {
        id: generateId(),
        ...operatingCostForm,
        amount: toNumber(operatingCostForm.amount),
        hoursPerCycle: toNumber(operatingCostForm.hoursPerCycle),
        monthlyAmount: monthlyAmount(operatingCostForm),
        createdAt: new Date(),
      });
      setOperatingCostForm(defaultOperatingCostForm());
      toast.success('Cost saved');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save cost');
    }
  };

  const handleMenuItemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await saveRecord('menu_item', {
        id: generateId(),
        ...menuItemForm,
        servingSize: toNumber(menuItemForm.servingSize),
        salePrice: toNumber(menuItemForm.salePrice),
        gasCost: toNumber(menuItemForm.gasCost),
        electricityCost: toNumber(menuItemForm.electricityCost),
        packagingCost: toNumber(menuItemForm.packagingCost),
        laborCost: toNumber(menuItemForm.laborCost),
        otherCost: toNumber(menuItemForm.otherCost),
        ingredients: menuIngredients,
        createdAt: new Date(),
      });
      setMenuItemForm(defaultMenuItemForm());
      setMenuIngredients([]);
      toast.success('Menu item saved');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save menu item');
    }
  };

  const handleMenuCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedItems = readCsvMenuItems(text);
      setCsvMenuItems(parsedItems);
      if (parsedItems.length === 0) {
        toast.error('No menu items found in CSV');
      } else {
        toast.success(`Read ${parsedItems.length} menu items`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to read CSV');
    } finally {
      event.target.value = '';
    }
  };

  const saveCsvMenuItems = async () => {
    if (csvMenuItems.length === 0) return;

    setSavingCsvMenu(true);
    try {
      await Promise.all(
        csvMenuItems.map((item) =>
          saveRecord('menu_item', {
            id: generateId(),
            name: item.name,
            description: item.description,
            servingSize: item.servingSize,
            servingUnit: item.servingUnit,
            salePrice: item.salePrice,
            gasCost: 0,
            electricityCost: 0,
            packagingCost: 0,
            laborCost: 0,
            otherCost: 0,
            ingredients: [],
            createdAt: new Date(),
          })
        )
      );
      toast.success(`Imported ${csvMenuItems.length} menu items`);
      setCsvMenuItems([]);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import menu items');
    } finally {
      setSavingCsvMenu(false);
    }
  };

  const addMenuIngredient = () => {
    if (!ingredientDraft.ingredientName || ingredientDraft.quantity <= 0) return;
    setMenuIngredients((current) => [...current, ingredientDraft]);
    setIngredientDraft({ ingredientName: '', quantity: 0, unit: 'lb' });
  };

  const calculateIngredientCost = (ingredients: MenuIngredient[]) =>
    ingredients.reduce((sum, ingredient) => {
      const price = latestIngredients.get(ingredient.ingredientName.toLowerCase());
      return sum + (price ? ingredient.quantity * unitCost(price) : 0);
    }, 0);

  const totalMonthlyOperatingCost = operatingCosts.reduce((sum, cost) => sum + cost.monthlyAmount, 0);
  const monthlyRunningCost = operatingCosts
    .filter((cost) => dailyRunningCostTypes.includes(cost.costType))
    .reduce((sum, cost) => sum + cost.monthlyAmount, 0);
  const dailyRunningCost = monthlyRunningCost / 30;

  if (loading && !payload) {
    return <main className="min-h-screen bg-gray-50 p-8 text-gray-600">Loading food cost data...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Food Cost</h1>
            <p className="text-gray-600">Ingredient prices, employee, utilities, rent, and menu item margin.</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900"
              placeholder="Search menu items"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-600">Ingredient Records</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{ingredientPrices.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-600">Monthly Operating Cost</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalMonthlyOperatingCost)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-600">Daily Running Cost</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(dailyRunningCost)}</p>
            <p className="mt-1 text-xs text-gray-500">Employees, utilities, gas, electricity, and rent</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-600">Menu Items</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{menuItems.length}</p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Groceries</h2>
            <form onSubmit={handleIngredientSubmit} className="space-y-3">
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Ingredient name" required value={ingredientForm.name} onChange={(event) => setIngredientForm((current) => ({ ...current, name: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Item code" value={ingredientForm.itemCode} onChange={(event) => setIngredientForm((current) => ({ ...current, itemCode: event.target.value }))} />
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Category" value={ingredientForm.category} onChange={(event) => setIngredientForm((current) => ({ ...current, category: event.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" min="0.01" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Qty" required value={ingredientForm.packageQuantity} onChange={(event) => setIngredientForm((current) => ({ ...current, packageQuantity: event.target.value }))} />
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Unit" required value={ingredientForm.packageUnit} onChange={(event) => setIngredientForm((current) => ({ ...current, packageUnit: event.target.value }))} />
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Price" required value={ingredientForm.packagePrice} onChange={(event) => setIngredientForm((current) => ({ ...current, packagePrice: event.target.value }))} />
              </div>
              <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" required value={ingredientForm.priceDate} onChange={(event) => setIngredientForm((current) => ({ ...current, priceDate: event.target.value }))} />
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Source" value={ingredientForm.source} onChange={(event) => setIngredientForm((current) => ({ ...current, source: event.target.value }))} />
              <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
                <Plus size={18} /> Save Price
              </button>
            </form>

            <div className="mt-6 max-h-96 space-y-3 overflow-y-auto">
              {ingredientPrices.slice(0, 12).map((ingredient) => {
                const trend = ingredientTrend(ingredientPrices, ingredient);
                return (
                  <div key={ingredient.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{ingredient.name}</p>
                        <p className="text-sm text-gray-600">
                          {ingredient.itemCode || 'No code'} • {formatCurrency(ingredient.packagePrice)} / {ingredient.packageQuantity} {ingredient.packageUnit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {trend > 0 && <ArrowUp className="text-red-600" size={18} />}
                        {trend < 0 && <ArrowDown className="text-green-600" size={18} />}
                        <button onClick={() => void deleteRecord('ingredient', ingredient.id)} className="text-gray-400 hover:text-red-600" type="button"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Employees & Utilities</h2>
            <form onSubmit={handleOperatingCostSubmit} className="space-y-3">
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={operatingCostForm.costType} onChange={(event) => setOperatingCostForm((current) => ({ ...current, costType: event.target.value as OperatingCostType }))}>
                <option value="employee">Employee</option>
                <option value="utility">Utility</option>
                <option value="rent">Rent</option>
                <option value="gas">Gas</option>
                <option value="electricity">Electricity</option>
                <option value="packaging">Packaging</option>
                <option value="other">Other</option>
              </select>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Name" required value={operatingCostForm.name} onChange={(event) => setOperatingCostForm((current) => ({ ...current, name: event.target.value }))} />
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Designation" value={operatingCostForm.designation} onChange={(event) => setOperatingCostForm((current) => ({ ...current, designation: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Amount" required value={operatingCostForm.amount} onChange={(event) => setOperatingCostForm((current) => ({ ...current, amount: event.target.value }))} />
                <select className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={operatingCostForm.payCycle} onChange={(event) => setOperatingCostForm((current) => ({ ...current, payCycle: event.target.value as PayCycle }))}>
                  <option value="hourly">Hourly</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>
              <input type="number" min="0" step="0.01" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Hours per cycle" value={operatingCostForm.hoursPerCycle} onChange={(event) => setOperatingCostForm((current) => ({ ...current, hoursPerCycle: event.target.value }))} />
              <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={operatingCostForm.effectiveDate} onChange={(event) => setOperatingCostForm((current) => ({ ...current, effectiveDate: event.target.value }))} />
              <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
                <Plus size={18} /> Save Cost
              </button>
            </form>

            <div className="mt-6 max-h-96 space-y-3 overflow-y-auto">
              {operatingCosts.map((cost) => (
                <div key={cost.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{cost.name}</p>
                      <p className="text-sm text-gray-600">
                        {cost.costType} • {cost.designation || 'No designation'} • {formatCurrency(cost.monthlyAmount)}/mo
                      </p>
                    </div>
                    <button onClick={() => void deleteRecord('operating_cost', cost.id)} className="text-gray-400 hover:text-red-600" type="button"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Item</h2>
            <div className="mb-5 rounded-lg border border-gray-200 p-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Upload size={18} />
                Upload Menu CSV
                <input type="file" accept=".csv,text/csv" onChange={handleMenuCsvUpload} className="sr-only" />
              </label>
              {csvMenuItems.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="max-h-40 space-y-2 overflow-y-auto text-sm">
                    {csvMenuItems.slice(0, 8).map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-gray-600">
                            {item.servingSize} {item.servingUnit} • {formatCurrency(item.salePrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {csvMenuItems.length > 8 && (
                      <p className="text-xs text-gray-500">{csvMenuItems.length - 8} more rows ready to import</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void saveCsvMenuItems()}
                      disabled={savingCsvMenu}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingCsvMenu ? 'Importing...' : 'Import Menu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvMenuItems([])}
                      disabled={savingCsvMenu}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleMenuItemSubmit} className="space-y-3">
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Menu item name" required value={menuItemForm.name} onChange={(event) => setMenuItemForm((current) => ({ ...current, name: event.target.value }))} />
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Short description" rows={2} value={menuItemForm.description} onChange={(event) => setMenuItemForm((current) => ({ ...current, description: event.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" min="0.01" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Size" value={menuItemForm.servingSize} onChange={(event) => setMenuItemForm((current) => ({ ...current, servingSize: event.target.value }))} />
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Unit" value={menuItemForm.servingUnit} onChange={(event) => setMenuItemForm((current) => ({ ...current, servingUnit: event.target.value }))} />
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Sale price" value={menuItemForm.salePrice} onChange={(event) => setMenuItemForm((current) => ({ ...current, salePrice: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Gas" value={menuItemForm.gasCost} onChange={(event) => setMenuItemForm((current) => ({ ...current, gasCost: event.target.value }))} />
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Electricity" value={menuItemForm.electricityCost} onChange={(event) => setMenuItemForm((current) => ({ ...current, electricityCost: event.target.value }))} />
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Packaging" value={menuItemForm.packagingCost} onChange={(event) => setMenuItemForm((current) => ({ ...current, packagingCost: event.target.value }))} />
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Labor" value={menuItemForm.laborCost} onChange={(event) => setMenuItemForm((current) => ({ ...current, laborCost: event.target.value }))} />
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <div className="grid grid-cols-3 gap-2">
                  <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Ingredient" value={ingredientDraft.ingredientName} onChange={(event) => setIngredientDraft((current) => ({ ...current, ingredientName: event.target.value }))} />
                  <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Qty" value={ingredientDraft.quantity || ''} onChange={(event) => setIngredientDraft((current) => ({ ...current, quantity: toNumber(event.target.value) }))} />
                  <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Unit" value={ingredientDraft.unit} onChange={(event) => setIngredientDraft((current) => ({ ...current, unit: event.target.value }))} />
                </div>
                <button type="button" onClick={addMenuIngredient} className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Add Ingredient</button>
                {menuIngredients.length > 0 && (
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    {menuIngredients.map((ingredient, index) => (
                      <div key={`${ingredient.ingredientName}-${index}`} className="flex justify-between gap-3">
                        <span>{ingredient.ingredientName} • {ingredient.quantity} {ingredient.unit}</span>
                        <button type="button" className="text-gray-400 hover:text-red-600" onClick={() => setMenuIngredients((current) => current.filter((_, idx) => idx !== index))}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
                <Plus size={18} /> Save Menu Item
              </button>
            </form>
          </section>
        </div>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Cost By Serving Size</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="py-3 pr-4">Item</th>
                  <th className="py-3 pr-4">Serving</th>
                  <th className="py-3 pr-4">Ingredients</th>
                  <th className="py-3 pr-4">Gas</th>
                  <th className="py-3 pr-4">Electricity</th>
                  <th className="py-3 pr-4">Packaging</th>
                  <th className="py-3 pr-4">Labor</th>
                  <th className="py-3 pr-4">Total Cost</th>
                  <th className="py-3 pr-4">Profit</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleMenuItems.map((item) => {
                  const ingredientCost = calculateIngredientCost(item.ingredients);
                  const totalCost = ingredientCost + item.gasCost + item.electricityCost + item.packagingCost + item.laborCost + item.otherCost;
                  const profit = item.salePrice - totalCost;
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 pr-4 text-gray-700">{item.servingSize} {item.servingUnit}</td>
                      <td className="py-3 pr-4 text-gray-700">{formatCurrency(ingredientCost)}</td>
                      <td className="py-3 pr-4 text-gray-700">{formatCurrency(item.gasCost)}</td>
                      <td className="py-3 pr-4 text-gray-700">{formatCurrency(item.electricityCost)}</td>
                      <td className="py-3 pr-4 text-gray-700">{formatCurrency(item.packagingCost)}</td>
                      <td className="py-3 pr-4 text-gray-700">{formatCurrency(item.laborCost)}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{formatCurrency(totalCost)}</td>
                      <td className={`py-3 pr-4 font-medium ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(profit)}</td>
                      <td className="py-3 pr-4">
                        <button onClick={() => void deleteRecord('menu_item', item.id)} className="text-gray-400 hover:text-red-600" type="button"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
