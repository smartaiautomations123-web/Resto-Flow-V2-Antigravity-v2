import "dotenv/config";
import * as db from "../server/db.js";
import { getDb } from "../server/db.js";
import * as schema from "../drizzle/schema.js";
import { sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── UTILS ───
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2);
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  date.setHours(randomInt(11, 22), randomInt(0, 59), 0); // 11 AM to 10 PM
  return date;
};
const randomWeekendBiasedDate = (daysBack: number) => {
  let date = randomDate(daysBack);
  // Bias towards Friday (5) and Saturday (6)
  if (Math.random() > 0.4 && ![5, 6].includes(date.getDay())) {
      date = randomDate(daysBack); // Try again
  }
  return date;
};

// ─── DATA POOLS ───
const firstNames = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","David","Elizabeth","William","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Nancy","Daniel","Lisa","Matthew","Betty","Anthony","Margaret","Mark","Sandra"];
const lastNames = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson"];

const generateName = () => `${randomElement(firstNames)} ${randomElement(lastNames)}`;

const suppliersData = [
  { name: "Sysco Broadline", contactName: "Bob Smith", email: "bob@sysco.test", phone: "555-0101" },
  { name: "Ocean Catch Seafood", contactName: "Captain Jack", email: "jack@oceancatch.test", phone: "555-0102" },
  { name: "Prime Valley Meats", contactName: "Ron Swanson", email: "ron@primevalley.test", phone: "555-0103" },
  { name: "Local Harvest Farms", contactName: "Daisy Green", email: "daisy@harvest.test", phone: "555-0104" },
  { name: "City Beverage Distributors", contactName: "Tom Collins", email: "tom@citybev.test", phone: "555-0105" }
];

const ingredientsData = {
  "Sysco Broadline": [
    { name: "Flour All Purpose", unit: "LBS", cost: "0.45", min: 50 },
    { name: "Sugar White", unit: "LBS", cost: "0.60", min: 50 },
    { name: "Kosher Salt", unit: "Case", cost: "15.00", min: 2 },
    { name: "Black Pepper", unit: "LBS", cost: "8.50", min: 5 },
    { name: "Olive Oil Extra Virgin", unit: "Gallon", cost: "22.50", min: 4 },
    { name: "Canola Oil", unit: "Gallon", cost: "14.00", min: 10 },
    { name: "Butter Unsalted", unit: "Case", cost: "85.00", min: 2 },
    { name: "Heavy Cream", unit: "Quart", cost: "4.50", min: 12 },
    { name: "Milk Whole", unit: "Gallon", cost: "3.80", min: 10 },
    { name: "Eggs Large AA", unit: "Case", cost: "32.00", min: 3 },
    { name: "Parmesan Cheese", unit: "LBS", cost: "7.50", min: 10 },
    { name: "Cheddar Sharp", unit: "LBS", cost: "4.20", min: 15 },
    { name: "Mozzarella Fresh", unit: "LBS", cost: "5.80", min: 10 },
    { name: "To-Go Boxes Large", unit: "Case", cost: "45.00", min: 5 },
    { name: "Napkins Dinner", unit: "Case", cost: "38.00", min: 5 },
    { name: "Pasta Linguine", unit: "LBS", cost: "1.20", min: 20 },
    { name: "Arborio Rice", unit: "LBS", cost: "2.10", min: 15 },
    { name: "Balsamic Vinegar", unit: "Gallon", cost: "28.00", min: 2 },
    { name: "Dijon Mustard", unit: "Gallon", cost: "18.00", min: 2 },
    { name: "Mayonnaise", unit: "Gallon", cost: "12.50", min: 4 }
  ],
  "Ocean Catch Seafood": [
    { name: "Salmon Filet (Faroe)", unit: "LBS", cost: "11.50", min: 20 },
    { name: "Tuna Ahi Sushi Grade", unit: "LBS", cost: "18.00", min: 10 },
    { name: "Halibut Filet", unit: "LBS", cost: "16.50", min: 10 },
    { name: "Sea Scallops U-10", unit: "LBS", cost: "22.00", min: 15 },
    { name: "Shrimp 16/20 Peeled", unit: "LBS", cost: "9.50", min: 30 },
    { name: "Calamari Tubes", unit: "LBS", cost: "5.50", min: 20 },
    { name: "Mussels PEI", unit: "LBS", cost: "3.20", min: 25 },
    { name: "Oysters East Coast", unit: "Each", cost: "1.10", min: 100 },
    { name: "Lobster Tail 8oz", unit: "Each", cost: "14.00", min: 20 },
    { name: "Crab Meat Jumbo Lump", unit: "LBS", cost: "38.00", min: 5 }
  ],
  "Prime Valley Meats": [
    { name: "Ribeye 14oz Prime", unit: "Each", cost: "18.50", min: 30 },
    { name: "Filet Mignon 8oz", unit: "Each", cost: "21.00", min: 20 },
    { name: "New York Strip 12oz", unit: "Each", cost: "16.00", min: 25 },
    { name: "Ground Beef 80/20", unit: "LBS", cost: "4.20", min: 50 },
    { name: "Chicken Breast Boneless", unit: "LBS", cost: "2.80", min: 80 },
    { name: "Chicken Wings Jumbo", unit: "LBS", cost: "2.40", min: 100 },
    { name: "Pork Chop Bone-in", unit: "Each", cost: "6.50", min: 20 },
    { name: "Bacon Thick Cut", unit: "LBS", cost: "5.50", min: 30 },
    { name: "Prosciutto di Parma", unit: "LBS", cost: "16.00", min: 5 },
    { name: "Lamb Chops", unit: "LBS", cost: "24.00", min: 10 }
  ],
  "Local Harvest Farms": [
    { name: "Romaine Hearts", unit: "Case", cost: "28.00", min: 4 },
    { name: "Spring Mix", unit: "Case", cost: "22.00", min: 3 },
    { name: "Tomatoes Roma", unit: "Case", cost: "35.00", min: 4 },
    { name: "Tomatoes Cherry", unit: "Flat", cost: "18.00", min: 5 },
    { name: "Onions Yellow", unit: "Sack", cost: "24.00", min: 3 },
    { name: "Onions Red", unit: "Sack", cost: "28.00", min: 2 },
    { name: "Garlic Peeled", unit: "Jar", cost: "16.00", min: 4 },
    { name: "Potatoes Russet", unit: "Case", cost: "22.00", min: 10 },
    { name: "Potatoes Fingerling", unit: "Case", cost: "38.00", min: 3 },
    { name: "Lemons", unit: "Case", cost: "42.00", min: 2 },
    { name: "Limes", unit: "Case", cost: "38.00", min: 3 },
    { name: "Avocados Hass", unit: "Case", cost: "48.00", min: 4 },
    { name: "Asparagus", unit: "Case", cost: "45.00", min: 3 },
    { name: "Broccolini", unit: "Case", cost: "32.00", min: 4 },
    { name: "Mushrooms Cremini", unit: "Flat", cost: "18.00", min: 5 },
    { name: "Carrots", unit: "Sack", cost: "14.00", min: 2 },
    { name: "Fresh Basil", unit: "LBS", cost: "12.00", min: 2 },
    { name: "Fresh Parsley", unit: "Bunch", cost: "0.80", min: 20 },
    { name: "Bell Peppers Mixed", unit: "Case", cost: "34.00", min: 3 },
    { name: "Strawberries", unit: "Flat", cost: "26.00", min: 4 }
  ],
  "City Beverage Distributors": [
    { name: "Vodka Well", unit: "Liter", cost: "9.00", min: 12 },
    { name: "Titos Vodka", unit: "Liter", cost: "18.50", min: 24 },
    { name: "Gin Well", unit: "Liter", cost: "9.00", min: 6 },
    { name: "Hendricks Gin", unit: "Liter", cost: "28.00", min: 6 },
    { name: "Tequila Well", unit: "Liter", cost: "11.00", min: 12 },
    { name: "Casamigos Blanco", unit: "Liter", cost: "38.00", min: 12 },
    { name: "Bourbon Well", unit: "Liter", cost: "10.00", min: 12 },
    { name: "Makers Mark", unit: "Liter", cost: "24.00", min: 12 },
    { name: "Cabernet House", unit: "Case", cost: "65.00", min: 5 },
    { name: "Chardonnay House", unit: "Case", cost: "65.00", min: 5 },
    { name: "IPA Local Draft", unit: "Keg", cost: "165.00", min: 2 },
    { name: "Pilsner Draft", unit: "Keg", cost: "145.00", min: 2 },
    { name: "Coke Syrup", unit: "BIB", cost: "85.00", min: 2 },
    { name: "Club Soda", unit: "Case", cost: "18.00", min: 10 }
  ]
};

const menuCategoriesData = ["Starters", "Salads", "Mains", "Steaks", "Sides", "Desserts", "Cocktails", "Wine", "Beer"];

const menuItemsData = [
  // Starters
  { cat: "Starters", name: "Crispy Calamari", price: "16.00", station: "fryer", pop: true, recipe: ["Calamari Tubes", "Canola Oil", "Lemons"] },
  { cat: "Starters", name: "Jumbo Lump Crab Cake", price: "22.00", station: "grill", pop: false, recipe: ["Crab Meat Jumbo Lump", "Mayonnaise", "Bell Peppers Mixed"] },
  { cat: "Starters", name: "Tuna Tartare", price: "19.00", station: "salad", pop: true, recipe: ["Tuna Ahi Sushi Grade", "Avocados Hass"] },
  { cat: "Starters", name: "PEI Mussels", price: "18.00", station: "grill", pop: false, recipe: ["Mussels PEI", "Garlic Peeled", "Butter Unsalted"] },
  { cat: "Starters", name: "Oysters on the Half Shell (1/2 Dozen)", price: "21.00", station: "salad", pop: true, recipe: ["Oysters East Coast", "Lemons"] },
  { cat: "Starters", name: "Charcuterie Board", price: "28.00", station: "salad", pop: true, recipe: ["Prosciutto di Parma", "Parmesan Cheese", "Dijon Mustard"] },

  // Salads
  { cat: "Salads", name: "Classic Caesar", price: "14.00", station: "salad", pop: true, recipe: ["Romaine Hearts", "Parmesan Cheese", "Garlic Peeled"] },
  { cat: "Salads", name: "House Greens", price: "12.00", station: "salad", pop: false, recipe: ["Spring Mix", "Tomatoes Cherry", "Balsamic Vinegar"] },
  { cat: "Salads", name: "Burrata & Tomato", price: "17.00", station: "salad", pop: true, recipe: ["Tomatoes Roma", "Olive Oil Extra Virgin", "Fresh Basil"] },

  // Mains
  { cat: "Mains", name: "Pan Seared Salmon", price: "34.00", station: "grill", pop: true, recipe: ["Salmon Filet (Faroe)", "Broccolini", "Lemons"] },
  { cat: "Mains", name: "Halibut Piccata", price: "38.00", station: "grill", pop: false, recipe: ["Halibut Filet", "Butter Unsalted", "Lemons"] },
  { cat: "Mains", name: "Scallop Risotto", price: "42.00", station: "grill", pop: true, recipe: ["Sea Scallops U-10", "Arborio Rice", "Parmesan Cheese"] },
  { cat: "Mains", name: "Roasted Half Chicken", price: "28.00", station: "grill", pop: false, recipe: ["Chicken Breast Boneless", "Potatoes Fingerling", "Carrots"] },
  { cat: "Mains", name: "Bistro Burger", price: "22.00", station: "grill", pop: true, recipe: ["Ground Beef 80/20", "Cheddar Sharp", "Potatoes Russet"] },
  { cat: "Mains", name: "Linguine Scampi", price: "29.00", station: "grill", pop: false, recipe: ["Shrimp 16/20 Peeled", "Pasta Linguine", "Garlic Peeled", "Butter Unsalted"] },

  // Steaks
  { cat: "Steaks", name: "14oz Prime Ribeye", price: "58.00", station: "grill", pop: true, recipe: ["Ribeye 14oz Prime", "Kosher Salt", "Black Pepper"] },
  { cat: "Steaks", name: "8oz Filet Mignon", price: "62.00", station: "grill", pop: true, recipe: ["Filet Mignon 8oz", "Butter Unsalted"] },
  { cat: "Steaks", name: "12oz New York Strip", price: "48.00", station: "grill", pop: false, recipe: ["New York Strip 12oz", "Kosher Salt"] },
  { cat: "Steaks", name: "Lamb Chops", price: "52.00", station: "grill", pop: false, recipe: ["Lamb Chops", "Fresh Rosemary"] }, // Missing rosemary, will fail silently or skip

  // Sides
  { cat: "Sides", name: "Truffle Fries", price: "12.00", station: "fryer", pop: true, recipe: ["Potatoes Russet", "Canola Oil", "Parmesan Cheese"] },
  { cat: "Sides", name: "Grilled Asparagus", price: "11.00", station: "grill", pop: false, recipe: ["Asparagus", "Olive Oil Extra Virgin"] },
  { cat: "Sides", name: "Mac & Cheese", price: "14.00", station: "grill", pop: true, recipe: ["Pasta Linguine", "Heavy Cream", "Cheddar Sharp"] },
  { cat: "Sides", name: "Sauteed Mushrooms", price: "10.00", station: "grill", pop: false, recipe: ["Mushrooms Cremini", "Butter Unsalted", "Garlic Peeled"] },

  // Desserts
  { cat: "Desserts", name: "New York Cheesecake", price: "12.00", station: "dessert", pop: true, recipe: ["Heavy Cream", "Sugar White", "Eggs Large AA"] },
  { cat: "Desserts", name: "Chocolate Lava Cake", price: "14.00", station: "dessert", pop: false, recipe: ["Flour All Purpose", "Sugar White", "Butter Unsalted"] },
  { cat: "Desserts", name: "Crème Brûlée", price: "11.00", station: "dessert", pop: true, recipe: ["Heavy Cream", "Eggs Large AA", "Sugar White"] },

  // Cocktails
  { cat: "Cocktails", name: "Classic Martini", price: "16.00", station: "bar", pop: true, recipe: ["Titos Vodka"] },
  { cat: "Cocktails", name: "Margarita", price: "15.00", station: "bar", pop: true, recipe: ["Casamigos Blanco", "Limes"] },
  { cat: "Cocktails", name: "Old Fashioned", price: "16.00", station: "bar", pop: true, recipe: ["Makers Mark"] },
  { cat: "Cocktails", name: "Gin & Tonic", price: "13.00", station: "bar", pop: false, recipe: ["Hendricks Gin", "Limes"] },

  // Wine
  { cat: "Wine", name: "Cabernet Sauvignon (Glass)", price: "14.00", station: "bar", pop: true, recipe: ["Cabernet House"] },
  { cat: "Wine", name: "Chardonnay (Glass)", price: "13.00", station: "bar", pop: true, recipe: ["Chardonnay House"] },

  // Beer
  { cat: "Beer", name: "Local IPA Draft", price: "9.00", station: "bar", pop: true, recipe: ["IPA Local Draft"] },
  { cat: "Beer", name: "Pilsner Draft", price: "8.00", station: "bar", pop: false, recipe: ["Pilsner Draft"] }
];

// Helper to format output for Excel nicely
function formatForExcel(data: any[]) {
  if (!data || data.length === 0) return [];
  return data.map(row => {
    const formatted: any = {};
    for (const key in row) {
      if (row[key] instanceof Date) {
        formatted[key] = row[key].toLocaleString();
      } else if (typeof row[key] === 'boolean') {
        formatted[key] = row[key] ? 'Yes' : 'No';
      } else {
        formatted[key] = row[key];
      }
    }
    return formatted;
  });
}

function exportToExcel(data: any, filePath: string) {
  const wb = XLSX.utils.book_new();

  for (const [sheetName, sheetData] of Object.entries(data)) {
    if (Array.isArray(sheetData) && sheetData.length > 0) {
      const formattedData = formatForExcel(sheetData);
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Auto-size columns slightly
      const cols = Object.keys(formattedData[0]).map(() => ({ wch: 15 }));
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    }
  }

  XLSX.writeFile(wb, filePath);
  console.log(`\n📊 Realistic Excel mock data exported to: ${filePath}`);
}

async function cleanDatabase(database: any) {
  console.log("🧹 Cleaning existing data (Truncating tables)...");
  try {
    await database.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    const tables = [
      'order_items', 'orders', 'recipes', 'menu_items', 'menu_categories',
      'ingredients', 'suppliers', 'staff', 'tables', 'sections', 'locations',
      'customers', 'segment_members', 'customer_segments'
    ];
    for (const table of tables) {
      await database.execute(sql.raw(`TRUNCATE TABLE \`${table}\`;`));
    }
    await database.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
  } catch (err) {
    console.log("Warning during cleanup:", err);
  }
}

async function run() {
  console.log("🚀 Starting HIGH-VOLUME REALISTIC mock data seed...");
  const database = await getDb();
  if (!database) throw new Error("Could not connect to database");

  await cleanDatabase(database);

  const mockDataExport: any = {};
  const idMap: any = { loc: 0, sections: [], tables: [], staff: [], suppliers: {}, ingredients: {}, cats: {}, items: {}, customers: [] };

  try {
    // ─── CATEGORY 1: Infrastructure & Identity ───
    console.log("\n🏢 Building Infrastructure...");
    const [locResult] = await database.insert(schema.locations).values({
      name: "The Grand American Bistro",
      address: "1200 Market Street, Metro City",
      phone: "555-0999",
      email: "info@grandbistro.com",
      timezone: "America/New_York",
      isActive: true,
    }) as any;
    idMap.loc = locResult.insertId;
    mockDataExport["Locations"] = await database.select().from(schema.locations);

    const sectionNames = ["Main Dining Room", "Patio", "Lounge", "Private Dining"];
    for (const s of sectionNames) {
      const [sec] = await database.insert(schema.sections).values({ name: s, description: s }) as any;
      idMap.sections.push({ id: sec.insertId, name: s });
    }
    mockDataExport["Sections"] = await database.select().from(schema.sections);

    let tableCounter = 1;
    for (const section of idMap.sections) {
      for (let i = 0; i < 8; i++) {
        const [tab] = await database.insert(schema.tables).values({
          locationId: idMap.loc,
          name: `Table ${tableCounter}`,
          seats: randomElement([2, 4, 6]),
          status: "free",
          section: section.name,
        }) as any;
        idMap.tables.push({ id: tab.insertId, name: `Table ${tableCounter}` });
        tableCounter++;
      }
    }
    mockDataExport["Tables"] = await database.select().from(schema.tables);

    const staffRoles = ["owner", "manager", "manager", "server", "server", "server", "server", "server", "server", "server", "server", "bartender", "bartender", "bartender", "kitchen", "kitchen", "kitchen", "kitchen", "kitchen", "kitchen"];
    for (let i = 0; i < staffRoles.length; i++) {
      const role = staffRoles[i];
      const [st] = await database.insert(schema.staff).values({
        locationId: idMap.loc,
        name: generateName(),
        role: role as any,
        pin: (1000 + i).toString(),
        hourlyRate: role === 'kitchen' ? "22.00" : (role === 'server' ? "8.00" : "25.00"),
        isActive: true
      }) as any;
      idMap.staff.push(st.insertId);
    }
    mockDataExport["Staff"] = await database.select().from(schema.staff);

    // ─── CATEGORY 5: Procurement & Inventory ───
    console.log("🚚 Building Supply Chain & Ingredients (100+ items)...");
    for (const sup of suppliersData) {
      const [s] = await database.insert(schema.suppliers).values(sup) as any;
      idMap.suppliers[sup.name] = s.insertId;
      
      const ingredientsList = ingredientsData[sup.name as keyof typeof ingredientsData];
      for (const ing of ingredientsList) {
        const currentStock = randomInt(ing.min - 2, ing.min + 20); // Some will be low stock
        const [iResult] = await database.insert(schema.ingredients).values({
          name: ing.name,
          unit: ing.unit,
          currentStock: currentStock.toString(),
          minStock: ing.min.toString(),
          costPerUnit: ing.cost,
          supplierId: s.insertId
        }) as any;
        idMap.ingredients[ing.name] = { id: iResult.insertId, cost: parseFloat(ing.cost) };
      }
    }
    mockDataExport["Suppliers"] = await database.select().from(schema.suppliers);
    mockDataExport["Ingredients"] = await database.select().from(schema.ingredients);

    // ─── CATEGORY 2: Menu & Recipes ───
    console.log("🍔 Building Menu & Recipes (50+ items)...");
    let sortOrder = 1;
    for (const catName of menuCategoriesData) {
      const [c] = await database.insert(schema.menuCategories).values({ name: catName, sortOrder }) as any;
      idMap.cats[catName] = c.insertId;
      sortOrder++;
    }
    mockDataExport["MenuCategories"] = await database.select().from(schema.menuCategories);

    for (const item of menuItemsData) {
      // Calculate a realistic cost based on recipe, or fallback to 30% of price
      let calculatedCost = 0;
      for (const ingName of item.recipe) {
        if (idMap.ingredients[ingName]) {
          calculatedCost += idMap.ingredients[ingName].cost * 0.5; // Roughly assume 0.5 unit used
        }
      }
      if (calculatedCost === 0) calculatedCost = parseFloat(item.price) * 0.28;

      const [mItem] = await database.insert(schema.menuItems).values({
        categoryId: idMap.cats[item.cat],
        name: item.name,
        price: item.price,
        cost: calculatedCost.toFixed(2),
        station: item.station as any,
        isPopular: item.pop
      }) as any;
      idMap.items[item.name] = { id: mItem.insertId, price: item.price, name: item.name };

      // Map recipes
      for (const ingName of item.recipe) {
        if (idMap.ingredients[ingName]) {
          await database.insert(schema.recipes).values({
            menuItemId: mItem.insertId,
            ingredientId: idMap.ingredients[ingName].id,
            quantity: randomFloat(0.2, 2.0).toString()
          });
        }
      }
    }
    mockDataExport["MenuItems"] = await database.select().from(schema.menuItems);
    mockDataExport["Recipes_COGS"] = await database.select({
      menuItem: schema.menuItems.name,
      ingredient: schema.ingredients.name,
      quantity: schema.recipes.quantity
    })
    .from(schema.recipes)
    .innerJoin(schema.menuItems, sql`${schema.menuItems.id} = ${schema.recipes.menuItemId}`)
    .innerJoin(schema.ingredients, sql`${schema.ingredients.id} = ${schema.recipes.ingredientId}`);

    // ─── CATEGORY 3: Customers ───
    console.log("👥 Generating 50+ Customers...");
    for (let i = 0; i < 50; i++) {
      const [c] = await database.insert(schema.customers).values({
        locationId: idMap.loc,
        name: generateName(),
        email: `customer${i}@example.com`,
        phone: `555-0${randomInt(100, 999)}`,
        visitCount: randomInt(1, 25),
        totalSpent: randomFloat(25.00, 1500.00),
        loyaltyPoints: randomInt(0, 500)
      }) as any;
      idMap.customers.push(c.insertId);
    }
    mockDataExport["Customers"] = await database.select().from(schema.customers);

    // ─── CATEGORY 4: Orders & Operations ───
    console.log("🧾 Generating 200+ Historical Orders (Analytics Data)...");
    const itemNames = Object.keys(idMap.items);
    
    for (let i = 0; i < 200; i++) {
      const orderDate = randomWeekendBiasedDate(30);
      const isVoided = Math.random() < 0.05; // 5% void rate
      const itemCount = randomInt(1, 5);
      
      let subtotal = 0;
      const orderItemsToInsert = [];

      for (let j = 0; j < itemCount; j++) {
        const selectedItemName = randomElement(itemNames);
        const itemObj = idMap.items[selectedItemName];
        subtotal += parseFloat(itemObj.price);
        orderItemsToInsert.push({
          menuItemId: itemObj.id,
          name: itemObj.name,
          quantity: 1,
          unitPrice: itemObj.price,
          totalPrice: itemObj.price,
          status: isVoided ? "voided" : "served"
        });
      }

      const tax = subtotal * 0.08;
      const total = subtotal + tax;

      const [o] = await database.insert(schema.orders).values({
        locationId: idMap.loc,
        orderNumber: `ORD-${10000 + i}`,
        type: randomElement(["dine_in", "dine_in", "dine_in", "takeaway", "delivery"]),
        status: isVoided ? "voided" : "completed",
        tableId: randomElement(idMap.tables).id,
        customerId: randomElement(idMap.customers),
        paymentMethod: randomElement(["card", "card", "card", "cash"]),
        paymentStatus: isVoided ? "refunded" : "paid",
        subtotal: subtotal.toFixed(2),
        taxAmount: tax.toFixed(2),
        total: total.toFixed(2),
        createdAt: orderDate,
        completedAt: isVoided ? null : orderDate,
        updatedAt: orderDate
      }) as any;

      for (const oi of orderItemsToInsert) {
        await database.insert(schema.orderItems).values({
          orderId: o.insertId,
          ...oi
        });
      }
    }
    
    // Add one live order
    const [liveO] = await database.insert(schema.orders).values({
      locationId: idMap.loc,
      orderNumber: `LIVE-${randomInt(100, 999)}`,
      type: "dine_in",
      status: "pending",
      tableId: idMap.tables[0].id,
      subtotal: "45.00",
      total: "48.60"
    }) as any;
    await database.insert(schema.orderItems).values({
      orderId: liveO.insertId,
      menuItemId: idMap.items["Bistro Burger"].id,
      name: "Bistro Burger",
      quantity: 2,
      unitPrice: "22.00",
      totalPrice: "44.00",
      status: "pending"
    });

    mockDataExport["Orders (History)"] = await database.select().from(schema.orders);

    console.log("\n✅ Database Seeding Complete!");

    // Export to Excel
    const excelPath = path.join(__dirname, "..", "mock_data_export.xlsx");
    exportToExcel(mockDataExport, excelPath);

  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    process.exit(0);
  }
}

run();
