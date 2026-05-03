/**
 * Deep analysis of the Prisura BETA APP spreadsheet
 * Extracts: sheet names, headers, row counts, sample data, formulas, data types
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'Prisura_BETA_APP.xlsx');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellDates: true });

const output = [];
const log = (msg) => { output.push(msg); console.log(msg); };

log('='.repeat(80));
log('DEEP ANALYSIS: Prisura BETA APP Spreadsheet');
log('='.repeat(80));
log(`File: ${filePath}`);
log(`Total Sheets: ${workbook.SheetNames.length}`);
log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);
log('');

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const totalRows = range.e.r - range.s.r + 1;
  const totalCols = range.e.c - range.s.c + 1;

  log('─'.repeat(80));
  log(`📊 SHEET: "${sheetName}"`);
  log(`   Rows: ${totalRows}, Columns: ${totalCols}`);
  log(`   Range: ${sheet['!ref'] || 'empty'}`);
  log('');

  // Get all data as JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (jsonData.length === 0) {
    log('   ⚠️  Sheet is empty');
    log('');
    continue;
  }

  // Headers (first row)
  const headers = jsonData[0];
  log('   📋 COLUMN HEADERS:');
  headers.forEach((h, i) => {
    if (h !== '') {
      const colLetter = XLSX.utils.encode_col(i);
      log(`      ${colLetter}: "${h}"`);
    }
  });
  log('');

  // Analyze data types per column
  log('   🔍 DATA TYPE ANALYSIS (per column):');
  for (let c = 0; c < Math.min(totalCols, 30); c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const header = headers[c] || `(Col ${colLetter})`;
    if (!header || header === '') continue;

    const values = [];
    const types = new Set();
    let formulaCount = 0;
    let emptyCount = 0;

    for (let r = 1; r < Math.min(jsonData.length, 200); r++) {
      const val = jsonData[r] ? jsonData[r][c] : '';
      if (val === '' || val === null || val === undefined) {
        emptyCount++;
      } else {
        values.push(val);
        types.add(typeof val);
      }

      // Check for formulas
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      if (cell && cell.f) {
        formulaCount++;
      }
    }

    const sampleVals = values.slice(0, 5).map(v => {
      const s = String(v);
      return s.length > 40 ? s.substring(0, 40) + '...' : s;
    });

    log(`      ${colLetter} "${header}": types=[${[...types].join(',')}], filled=${values.length}, empty=${emptyCount}, formulas=${formulaCount}`);
    if (sampleVals.length > 0) {
      log(`         samples: ${JSON.stringify(sampleVals)}`);
    }
  }
  log('');

  // Find all formulas in the sheet
  const formulas = [];
  for (const cellRef in sheet) {
    if (cellRef.startsWith('!')) continue;
    const cell = sheet[cellRef];
    if (cell && cell.f) {
      formulas.push({ ref: cellRef, formula: cell.f });
    }
  }

  if (formulas.length > 0) {
    log(`   ⚙️  FORMULAS FOUND: ${formulas.length} total`);
    // Show unique formula patterns
    const uniquePatterns = new Map();
    for (const f of formulas) {
      // Generalize: replace cell refs with placeholders
      const pattern = f.formula.replace(/[A-Z]+\d+/g, 'REF').replace(/\d+/g, 'N');
      if (!uniquePatterns.has(pattern)) {
        uniquePatterns.set(pattern, { example: f.formula, ref: f.ref, count: 1 });
      } else {
        uniquePatterns.get(pattern).count++;
      }
    }
    log(`   📐 UNIQUE FORMULA PATTERNS: ${uniquePatterns.size}`);
    let patternIdx = 0;
    for (const [pattern, info] of uniquePatterns) {
      if (patternIdx >= 20) {
        log(`      ... and ${uniquePatterns.size - 20} more patterns`);
        break;
      }
      log(`      [${info.ref}] ${info.example}  (used ${info.count}x)`);
      patternIdx++;
    }
    log('');
  }

  // Sample rows (first 5 data rows)
  log('   📝 SAMPLE DATA (first 5 rows):');
  for (let r = 1; r <= Math.min(5, jsonData.length - 1); r++) {
    const row = jsonData[r];
    const rowObj = {};
    headers.forEach((h, i) => {
      if (h && h !== '' && row[i] !== '' && row[i] !== null && row[i] !== undefined) {
        rowObj[h] = row[i];
      }
    });
    if (Object.keys(rowObj).length > 0) {
      const truncated = {};
      for (const [k, v] of Object.entries(rowObj)) {
        const s = String(v);
        truncated[k] = s.length > 60 ? s.substring(0, 60) + '...' : v;
      }
      log(`      Row ${r}: ${JSON.stringify(truncated)}`);
    }
  }
  log('');

  // Merged cells
  if (sheet['!merges'] && sheet['!merges'].length > 0) {
    log(`   🔗 MERGED CELLS: ${sheet['!merges'].length}`);
    for (const merge of sheet['!merges'].slice(0, 10)) {
      log(`      ${XLSX.utils.encode_range(merge)}`);
    }
    if (sheet['!merges'].length > 10) {
      log(`      ... and ${sheet['!merges'].length - 10} more`);
    }
    log('');
  }
}

// Named ranges
if (workbook.Workbook && workbook.Workbook.Names) {
  log('─'.repeat(80));
  log('📛 NAMED RANGES / DEFINED NAMES:');
  for (const name of workbook.Workbook.Names) {
    log(`   ${name.Name}: ${name.Ref}`);
  }
  log('');
}

// Write full analysis to a file
const outputPath = path.join(__dirname, 'spreadsheet_analysis.txt');
fs.writeFileSync(outputPath, output.join('\n'), 'utf8');
log(`\n✅ Full analysis saved to: ${outputPath}`);
