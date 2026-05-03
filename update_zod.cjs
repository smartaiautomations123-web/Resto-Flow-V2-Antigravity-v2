const fs = require('fs');
let code = fs.readFileSync('server/routers.ts', 'utf8');

// standard schema replacements
const replacements = [
  { p: /id: z\.number\(\)/g, r: 'id: z.number({ required_error: "ID is required" })' },
  { p: /locationId: z\.number\(\)/g, r: 'locationId: z.number({ required_error: "Location ID is required" })' },
  { p: /staffId: z\.number\(\)/g, r: 'staffId: z.number({ required_error: "Staff ID is required" })' },
  { p: /customerId: z\.number\(\)/g, r: 'customerId: z.number({ required_error: "Customer ID is required" })' },
  { p: /supplierId: z\.number\(\)/g, r: 'supplierId: z.number({ required_error: "Supplier ID is required" })' },
  { p: /menuItemId: z\.number\(\)/g, r: 'menuItemId: z.number({ required_error: "Menu Item ID is required" })' },
  { p: /name: z\.string\(\)/g, r: 'name: z.string({ required_error: "Name is required" })' },
  { p: /date: z\.string\(\)/g, r: 'date: z.string({ required_error: "Date is required" })' }
];

replacements.forEach(({p, r}) => {
  code = code.replace(p, r);
});

fs.writeFileSync('server/routers.ts', code);
console.log('Routers updated with Zod errors');
