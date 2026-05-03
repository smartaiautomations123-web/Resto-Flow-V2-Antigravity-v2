import * as XLSX from 'xlsx';
import { resolve } from 'path';

const workbookPath = "C:/Users/alexb/Downloads/Copy of Prisura_BETA_APP.xlsx";

function analyze() {
  const wb = XLSX.readFile(workbookPath);
  const report: any = {};

  // 1. Basic Stats
  report.sheets = wb.SheetNames;
  
  // 2. Ingredients (Items)
  const itemsSheet = wb.Sheets['Items'];
  const items = XLSX.utils.sheet_to_json(itemsSheet);
  report.ingredientSummary = {
    total: items.length,
    categories: Array.from(new Set(items.map((i: any) => i.Category))).filter(Boolean),
    uoms: Array.from(new Set(items.map((i: any) => i.BaseUoM))).filter(Boolean),
  };

  // 3. 2025 Spend Analysis
  const spend2025Sheet = wb.Sheets['2025'];
  const spend2025 = XLSX.utils.sheet_to_json(spend2025Sheet);
  let totalSpend = 0;
  let totalSavings = 0;
  spend2025.forEach((row: any) => {
    const cost = parseFloat(row['Combined Total Cost'] || 0);
    const savings = parseFloat(row['Annual Savings Potential'] || 0);
    totalSpend += cost;
    totalSavings += savings;
  });
  report.spend2025 = {
    totalSpend: totalSpend.toFixed(2),
    potentialSavings: totalSavings.toFixed(2),
    savingsPercentage: ((totalSavings / totalSpend) * 100).toFixed(2) + '%',
    topItems: spend2025.slice(0, 10).map((i: any) => ({
        name: i['Product Code'],
        spend: i['Combined Total Cost']
    }))
  };

  // 4. Inventory Insights
  const countsSheet = wb.Sheets['InventoryCounts'];
  const counts = XLSX.utils.sheet_to_json(countsSheet);
  report.inventory = {
    totalEvents: counts.length,
    users: Array.from(new Set(counts.map((c: any) => c.User))).filter(Boolean),
    lastCount: counts[counts.length - 1]
  };

  // 5. Pricing Health
  const currentPricesSheet = wb.Sheets['Price_Current'];
  const currentPrices = XLSX.utils.sheet_to_json(currentPricesSheet);
  const oldPricesSheet = wb.Sheets['Old Prices'];
  const oldPrices = XLSX.utils.sheet_to_json(oldPricesSheet);
  report.pricing = {
    activePriceRecords: currentPrices.length,
    historicalPriceRecords: oldPrices.length,
    vendors: Array.from(new Set(currentPrices.map((p: any) => p.Vendor))).filter(Boolean)
  };

  // 6. Unit Conversion Rules
  const convSheet = wb.Sheets['Unit_Conversions'];
  const conversions = XLSX.utils.sheet_to_json(convSheet);
  report.conversions = {
    ruleCount: conversions.length
  };

  console.log(JSON.stringify(report, null, 2));
}

analyze();
