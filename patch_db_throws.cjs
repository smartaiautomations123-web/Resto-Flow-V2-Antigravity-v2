const fs = require('fs');
let c = fs.readFileSync('server/db.ts', 'utf8');
c = c.replace(/if \(\!db\) throw new Error\("Database not available"\);/g, 'if (!db) return [] as any;');
fs.writeFileSync('server/db.ts', c);
console.log('Throws patched');
