'use client';

import { ExternalLink, Link2, ShieldCheck } from 'lucide-react';

export const SheetsConnectionCard = () => {
  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;

  const handleLink = () => {
    window.open('/api/google/oauth', '_blank');
  };

  const handleOpenSheet = () => {
    if (!sheetId) return;
    window.open(`https://docs.google.com/spreadsheets/d/${sheetId}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Persis Indian Grill</p>
          <h3 className="text-xl font-semibold text-gray-900 mt-1">Link Your Google Sheets</h3>
          <p className="text-sm text-gray-700 mt-2">
            Keep the kitchen ledger synced. Connect once, then every save updates your sheet.
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700">
          <ShieldCheck size={22} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition"
        >
          <Link2 size={16} />
          Link Sheets
        </button>
        <button
          onClick={handleOpenSheet}
          disabled={!sheetId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition disabled:opacity-50"
        >
          <ExternalLink size={16} />
          Open Sheet
        </button>
        {!sheetId && (
          <span className="text-xs text-amber-800 self-center">
            Missing `NEXT_PUBLIC_GOOGLE_SHEET_ID`
          </span>
        )}
      </div>
    </div>
  );
};
