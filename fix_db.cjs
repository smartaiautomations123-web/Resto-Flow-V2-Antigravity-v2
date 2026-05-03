const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

// Fix getForecastedDemand fallback
code = code.replace(
  /if \(\!db\) return \{ ingredientId, forecast: 0, confidence: 0 \};/g,
  "if (!db) return { ingredientId, daysAhead, forecastedQuantity: '0.00', confidence: 0, recommendation: 'No DB data available.' };"
);

// Find all occurrences of "const db = await getDb();"
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const db = await getDb();')) {
    // Look ahead to see if there's an if (!db)
    let hasCheck = false;
    for (let j = 1; j <= 5; j++) {
      if (lines[i+j] && lines[i+j].includes('if (!db)')) {
        hasCheck = true;
        break;
      }
    }
    
    if (!hasCheck) {
      // Determine what to return based on the next few lines
      let returnStatement = 'if (!db) return null;';
      for (let j = 1; j <= 20; j++) {
        if (lines[i+j]) {
          if (lines[i+j].includes('.map(') || lines[i+j].includes('[]') || lines[i+j].includes('return {') !== -1 && lines[i+j-1].includes('return items')) {
             returnStatement = 'if (!db) return [];';
             break;
          }
        }
      }
      
      // Heuristic: if it's get(something)s or list(something)s, return []
      let funcDec = "";
      for (let j = i; j >= i-5; j--) {
        if (lines[j] && lines[j].includes('export async function')) {
           funcDec = lines[j];
           break;
        }
      }
      
      if (funcDec.includes('Templates') || funcDec.includes('Suggestions') || funcDec.includes('Modifications') || funcDec.includes('getMenu') || funcDec.includes('Items(')) {
        returnStatement = 'if (!db) return [];';
      }
      
      if (funcDec.includes('generateIngredientBarcode')) returnStatement = "if (!db) return 'ING-000000';";
      
      // insert check right after const db = await getDb();
      lines.splice(i + 1, 0, '  ' + returnStatement);
      i++; // increment i to account for the new line
    }
  }
}

fs.writeFileSync('server/db.ts', lines.join('\n'));
console.log("DB checks patched.");
