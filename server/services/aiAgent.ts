import { invokeLLM, Message, Tool, ToolCall } from "../_core/llm";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const MAX_ITERATIONS = 5;

const tools: Tool[] = [
    {
        type: "function",
        function: {
            name: "get_database_schema",
            description: "Retrieves the database schema. Pass a table name to get its exact columns, or pass nothing to get a list of all tables in the database.",
            parameters: {
                type: "object",
                properties: {
                    target_table: {
                        type: "string",
                        description: "Optional. The exact name of the table to inspect. Leave empty to see all tables."
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "execute_sql",
            description: "Executes an arbitrary SQL query (SELECT, UPDATE, INSERT, DELETE) against the MySQL database. Use this to analyze data or execute requested tasks.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The raw SQL query string to execute."
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_staff_on_shift",
            description: "Returns a list of currently clocked-in staff members, including their name, role, and clock-in time. Use this to answer questions about who's currently working.",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "Optional. The date to check for clocked-in staff in YYYY-MM-DD format. Defaults to today if not provided."
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_draft_purchase_order",
            description: "Automatically detects low stock levels and prepares draft purchase orders grouped by supplier. Requires user confirmation before execution.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    }
];

export interface AiAgentResult {
    answer: string;
    pendingSql?: string;
    requiresConfirmation?: boolean;
}

function isMutationQuery(query: string): boolean {
    // 1. Strip comments
    let stripped = query.replace(/\/\*[\s\S]*?\*\//g, ''); // Block comments
    stripped = stripped.replace(/--.*$/gm, ''); // Dash comments
    stripped = stripped.replace(/#.*$/gm, ''); // Hash comments
    
    // 2. Strip string literals to avoid false positives on words inside strings
    const noStrings = stripped.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').toUpperCase();

    const allowedKeywords = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'PRAGMA', 'WITH'];
    const mutationKeywords = ['UPDATE', 'INSERT', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'REPLACE', 'GRANT', 'REVOKE', 'CALL', 'EXECUTE', 'UPSERT', 'MERGE'];

    // 3. Deep scan: if ANY mutation keyword exists anywhere outside of strings/comments, flag it
    const hasMutation = mutationKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`);
        return regex.test(noStrings);
    });
    if (hasMutation) return true;

    // 4. Split by semicolon for multi-statement queries
    const statements = noStrings.split(';');
    
    for (let statement of statements) {
        let trimmed = statement.trim();
        if (!trimmed) continue;
        
        // Find the first word
        const firstWordMatch = trimmed.match(/^[A-Z]+/);
        if (!firstWordMatch) return true; // Unrecognized start, treat as mutation for safety
        const firstWord = firstWordMatch[0];

        // If the first command is NOT in the allowlist, require confirmation
        if (!allowedKeywords.includes(firstWord)) {
            return true;
        }
    }
    
    return false;
}

export async function processAiAgentQuery(userQuery: string, confirmedSql?: string): Promise<AiAgentResult> {
    const messages: Message[] = [
        {
            role: "system",
            content: `You are Dash, RestoFlow's intelligent autonomous AI Employee.
You can execute raw SQL to answer user questions, analyze data, and perform modifications.
You have direct access to a MySQL database via tools. 
When asked a question:
1. First use get_database_schema to find the right tables.
2. Then use get_database_schema with the specific table names to see their columns.
3. For staffing questions, first check get_staff_on_shift.
4. For inventory replenishment and draft purchase orders, use create_draft_purchase_order.
5. Then write and execute the SQL query using execute_sql if more detail is needed.
6. If an update/insert is requested, execute the SQL and return success. 
7. Always analyze the results and provide a final natural language answer.`
        },
        {
            role: "user",
            content: userQuery
        }
    ];

    let iterations = 0;
    let currentConfirmedSql = confirmedSql;

    while (iterations < MAX_ITERATIONS) {
        iterations++;
        
        const response = await invokeLLM({
            messages,
            tools
        });

        const assistantMessage = response.choices[0]?.message;
        
        if (!assistantMessage) {
            throw new Error("No response from AI.");
        }

        const toolCalls = assistantMessage.tool_calls;
        
        let contentToPush = "";
        if (typeof assistantMessage.content === "string") {
            contentToPush = assistantMessage.content;
        } else if (Array.isArray(assistantMessage.content)) {
            contentToPush = assistantMessage.content
                .filter(c => c.type === "text")
                .map(c => (c as any).text || "")
                .join("\n");
        }

        messages.push({
            role: "assistant",
            content: contentToPush,
            // @ts-ignore
            tool_calls: toolCalls
        });

        // If no tool calls, the AI is done and we can return its final answer
        if (!toolCalls || toolCalls.length === 0) {
            return { answer: contentToPush };
        }

        // Handle tool calls
        for (const toolCall of toolCalls) {
            if (toolCall.function.name === "execute_sql") {
                const args = JSON.parse(toolCall.function.arguments);
                const query = args.query;

                if (isMutationQuery(query)) {
                    // Check if this specific query was just confirmed by the user
                    if (currentConfirmedSql && currentConfirmedSql.trim() === query.trim()) {
                        // User confirmed, proceed to execute
                        const result = await handleToolCall(toolCall, currentConfirmedSql);
                        messages.push({
                            role: "tool",
                            name: toolCall.function.name,
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(result)
                        });
                        // Clear it so it's only used once
                        currentConfirmedSql = undefined;
                    } else {
                        // Mutation detected! Suspend and ask for confirmation
                        return {
                            answer: contentToPush || "I need to execute a database update. Please review and confirm the SQL below:",
                            pendingSql: query,
                            requiresConfirmation: true
                        };
                    }
                } else {
                    // Read-only query, proceed normally
                    const result = await handleToolCall(toolCall);
                    messages.push({
                        role: "tool",
                        name: toolCall.function.name,
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result)
                    });
                }
            } else if (toolCall.function.name === "create_draft_purchase_order") {
                const result = await handleToolCall(toolCall, currentConfirmedSql);
                
                if (result.pendingSql && result.requiresConfirmation) {
                    return {
                        answer: contentToPush || "I've detected low stock levels. I'm preparing draft purchase orders. Please review and confirm the SQL below:",
                        pendingSql: result.pendingSql,
                        requiresConfirmation: true
                    };
                }

                messages.push({
                    role: "tool",
                    name: toolCall.function.name,
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
                currentConfirmedSql = undefined;
            } else {
                // Handle non-SQL tools (like schema inspection)
                const result = await handleToolCall(toolCall);
                messages.push({
                    role: "tool",
                    name: toolCall.function.name,
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
            }
        }
    }

    return { answer: "I reached the maximum number of reasoning iterations without a final answer. Please try simplifying your request." };
}

async function handleToolCall(toolCall: ToolCall, confirmedSql?: string): Promise<any> {
    const db = await getDb();
    if (!db) {
        throw new Error("Database connection not available.");
    }
    
    try {
        const args = JSON.parse(toolCall.function.arguments);
        
        if (toolCall.function.name === "get_database_schema") {
            if (args.target_table) {
                const cols = await db.execute(sql.raw(`SHOW COLUMNS FROM \`${args.target_table}\``));
                return cols[0];
            } else {
                const tables = await db.execute(sql.raw(`SHOW TABLES`));
                return tables[0];
            }
        } 
        else if (toolCall.function.name === "execute_sql") {
            const query = args.query;
            const result = await db.execute(sql.raw(query));
            return result[0]; // mysql2 returns [rows, fields]
        }
        else if (toolCall.function.name === "get_staff_on_shift") {
            const date = args.date || new Date().toISOString().split('T')[0];
            const result = await db.execute(sql`
                SELECT s.name, s.role, tc.clockIn
                FROM staff s
                JOIN time_clock tc ON s.id = tc.staffId
                WHERE tc.clockOut IS NULL
                  AND DATE(tc.clockIn) = ${date}
            `);
            return result[0];
        }
        else if (toolCall.function.name === "create_draft_purchase_order") {
            // 1. Fetch ingredients low on stock
            const lowStockIngredients = await db.execute(sql.raw(`
                SELECT id, name, currentStock, minStock, supplierId
                FROM ingredients
                WHERE currentStock < minStock AND supplierId IS NOT NULL AND isActive = 1
            `));
            
            const items = lowStockIngredients[0] as unknown as any[];
            if (items.length === 0) {
                return { summary: "No items found with stock below minimum levels." };
            }

            // 2. Group by supplierId
            const groupedBySupplier: Record<number, any[]> = {};
            items.forEach(item => {
                if (!groupedBySupplier[item.supplierId]) {
                    groupedBySupplier[item.supplierId] = [];
                }
                groupedBySupplier[item.supplierId].push(item);
            });

            // 3. Prepare SQL
            let sqlToExecute = "";
            const summaries: string[] = [];
            
            for (const supplierId in groupedBySupplier) {
                const supplierItems = groupedBySupplier[supplierId];
                sqlToExecute += `INSERT INTO purchase_orders (supplierId, status, createdAt, updatedAt) VALUES (${supplierId}, 'draft', NOW(), NOW());\n`;
                summaries.push(`Supplier #${supplierId}: ${supplierItems.length} items`);
            }

            // check if confirmed
            if (confirmedSql && confirmedSql.trim() === sqlToExecute.trim()) {
                // Execute line by line (or multi-statement if enabled)
                // mysql2 can handle multiple statements if configured, but let's be safe
                const sqlLines = sqlToExecute.trim().split('\n');
                for (const line of sqlLines) {
                    if (line.trim()) {
                        await db.execute(sql.raw(line));
                    }
                }
                return { 
                    summary: `Successfully created ${Object.keys(groupedBySupplier).length} draft purchase orders.`,
                    details: summaries
                };
            } else {
                return {
                    pendingSql: sqlToExecute,
                    requiresConfirmation: true,
                    summaryPreview: summaries
                };
            }
        }
        
    } catch (e: any) {
        return { error: e.message || "Unknown tool execution error" };
    }
}

