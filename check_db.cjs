const fs = require('fs');
const lines = fs.readFileSync('server/db.ts', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const db = await getDb();')) {
    let missing = true;
    for (let j = 1; j <= 5; j++) {
      if (lines[i + j] && lines[i + j].includes('if (!db)')) {
        missing = false;
        break;
      }
    }
    if (missing) {
      console.log(`Missing check near line ${i + 1}`);
      // Print context
      console.log(lines.slice(i-2, i+3).join('\n'));
      console.log('---');
    }
  }
}
