function isMutationQuery(query) {
    // 1. Strip comments
    let stripped = query.replace(/\/\*[\s\S]*?\*\//g, ''); // Block comments
    stripped = stripped.replace(/--.*$/gm, ''); // Dash comments
    stripped = stripped.replace(/#.*$/gm, ''); // Hash comments
    
    // 2. Split by semicolon for multi-statement queries
    const statements = stripped.split(';');
    
    const allowedKeywords = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'PRAGMA'];
    const mutationKeywords = ['UPDATE', 'INSERT', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'REPLACE', 'GRANT', 'REVOKE', 'CALL', 'EXECUTE', 'UPSERT', 'MERGE'];

    for (let statement of statements) {
        let trimmed = statement.trim().toUpperCase();
        if (!trimmed) continue;
        
        // Find the first word
        const firstWordMatch = trimmed.match(/^[A-Z]+/);
        if (!firstWordMatch) return true; // Unrecognized start, treat as mutation for safety
        const firstWord = firstWordMatch[0];

        if (firstWord === 'WITH') {
            // Remove string literals to avoid false positives on words inside strings
            const noStrings = trimmed.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');
            const hasMutation = mutationKeywords.some(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                return regex.test(noStrings);
            });
            if (hasMutation) return true; 
            continue;
        }

        // If the first command is NOT in the allowlist, require confirmation
        if (!allowedKeywords.includes(firstWord)) {
            return true;
        }
    }
    
    return false;
}

const payloads = [
    { name: "Standard UPDATE", query: "UPDATE users SET role = 'admin'", expectMutation: true },
    { name: "Comment prefix", query: "/* sneak */ UPDATE users SET role = 'admin'", expectMutation: true },
    { name: "CTE prefix", query: "WITH temp AS (SELECT 1) UPDATE users SET role = 'admin'", expectMutation: true },
    { name: "Multi-statement", query: "SELECT 1; UPDATE users SET role = 'admin'", expectMutation: true },
    { name: "Lowercase", query: "update users set role = 'admin'", expectMutation: true },
    { name: "Valid SELECT", query: "SELECT * FROM users", expectMutation: false },
    { name: "Valid CTE SELECT", query: "WITH temp AS (SELECT 1) SELECT * FROM temp", expectMutation: false },
    { name: "Dash comments", query: "-- admin time\nDELETE FROM users;", expectMutation: true },
    { name: "Hash comments", query: "# delete it all\nTRUNCATE TABLE users;", expectMutation: true },
    { name: "Nested String Match", query: "SELECT * FROM users WHERE name = 'UPDATE users'", expectMutation: false },
    { name: "CTE Nested String", query: "WITH A AS (SELECT 1) SELECT * FROM A WHERE text = 'DELETE FROM x'", expectMutation: false },
    { name: "Unknown command", query: "MYCOMMAND table", expectMutation: true },
];

let allPassed = true;
console.log("Testing new isMutationQuery Logic:");
payloads.forEach(p => {
    const detected = isMutationQuery(p.query);
    const passed = detected === p.expectMutation;
    if (!passed) allPassed = false;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${p.name}: Expected ${p.expectMutation}, Got ${detected}`);
});

if (allPassed) {
    console.log("\n✅ All payloads blocked/allowed exactly as intended!");
} else {
    console.log("\n❌ SOME TESTS FAILED");
    process.exit(1);
}
