import fs from 'fs';
const file = 'scripts/seed-mock-data.ts';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/"saute"/g, '"grill"').replace(/"pantry"/g, '"salad"');
fs.writeFileSync(file, data);
console.log('Fixed enums!');
