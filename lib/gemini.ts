import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
console.log("Gemini API Key defined:", !!apiKey, apiKey.slice(0, 5) + "...");
const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "You are Malema Pro Advisor (Level 10), a business intelligent assistant for a warehouse ERP (Malema). Your goal is to help the user manage products, sales, expenses, and provide insights. Use the provided tools to interact with the database. Always respond in Georgian unless asked otherwise. Be professional and proactive.",
});

export const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "get_inventory",
        description: "Get the current stock list, total stock count, and low stock alerts.",
      },
      {
        name: "search_product",
        description: "Search for a product by name or category.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "The product name or category to search for.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "add_sale",
        description: "Record a new sale for a product.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productId: { type: SchemaType.STRING },
            productName: { type: SchemaType.STRING },
            category: { type: SchemaType.STRING },
            quantity: { type: SchemaType.NUMBER },
            salePrice: { type: SchemaType.NUMBER },
            paidAmount: { type: SchemaType.NUMBER },
            status: { type: SchemaType.STRING, enum: ["paid", "partial", "unpaid"], format: "enum" },
            client: { type: SchemaType.STRING },
          },
          required: ["productId", "productName", "quantity", "salePrice"],
        },
      },
      {
        name: "add_expense",
        description: "Record a new operational expense.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            amount: { type: SchemaType.NUMBER },
            category: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING, description: "ISO date format (YYYY-MM-DD)" },
          },
          required: ["amount", "description"],
        },
      },
      {
        name: "get_financial_report",
        description: "Get total revenue, profit, and expenses summary.",
      },
      {
        name: "navigate_to",
        description: "Navigate to a specific page in the application.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            page: { type: SchemaType.STRING, enum: ["dashboard", "warehouse", "sales", "purchase", "analytics"], format: "enum" },
          },
          required: ["page"],
        },
      },
    ],
  },
];
