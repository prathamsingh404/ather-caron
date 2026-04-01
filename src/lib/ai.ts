import Groq from "groq-sdk";
import { Category } from "@prisma/client";
import { DashboardSnapshot } from "@/lib/dashboard-data";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ReceiptActivity = {
  name: string;
  category: Category;
  subcategory: string;
  value: number;
  unit: string;
  carbon_equivalent: number;
  insight_hint?: string;
};

const FAST_MODEL = "llama-3.1-8b-instant";
const REPORT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-11b-vision-preview",
];

function getClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return new Groq({ apiKey });
}

export function groqIsConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function toReadableCategory(category: string) {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

export function buildInsightFallback(snapshot: DashboardSnapshot) {
  return snapshot.insightFallback;
}

export async function generatePersonalizedInsight(snapshot: DashboardSnapshot) {
  const client = getClient();
  if (!client) {
    return {
      insight: buildInsightFallback(snapshot),
      source: "fallback" as const,
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: FAST_MODEL,
      temperature: 0.4,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "You are an AI sustainability coach. Produce one grounded, data-backed recommendation in 2 sentences max.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              topCategory: snapshot.topCategory,
              monthKg: snapshot.totals.monthKg,
              monthDeltaPct: snapshot.totals.monthDeltaPct,
              budgetLeftKg: snapshot.budget.budgetLeftKg,
              recentEntries: snapshot.recentEntries.slice(0, 4),
            },
            null,
            2,
          ),
        },
      ],
    });

    return {
      insight:
        completion.choices[0]?.message?.content?.trim() ||
        buildInsightFallback(snapshot),
      source: "groq" as const,
    };
  } catch (error) {
    console.error("Groq insight generation failed:", error);
    return {
      insight: buildInsightFallback(snapshot),
      source: "fallback" as const,
    };
  }
}

export async function generateChatReply(messages: ChatMessage[], snapshot: DashboardSnapshot) {
  const client = getClient();
  const systemMessage = `You are Carbon AI, a concise sustainability assistant embedded inside Aether Carbon.
Use the live user context below when it is relevant:
- Monthly footprint: ${snapshot.totals.monthKg} kg CO2e
- Top category: ${snapshot.topCategory.category}
- Budget left this month: ${snapshot.budget.budgetLeftKg} kg
- Recent categories: ${snapshot.recentEntries.map((entry) => entry.category).join(", ") || "none"}
Reply clearly, practically, and avoid generic advice.`;

  if (!client) {
    return {
      response: `${buildInsightFallback(snapshot)} Ask about transport, energy, food, water, or shopping and I’ll tailor the advice from your current data.`,
      source: "fallback" as const,
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: FAST_MODEL,
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemMessage },
        ...messages,
      ],
    });

    return {
      response:
        completion.choices[0]?.message?.content?.trim() ||
        buildInsightFallback(snapshot),
      source: "groq" as const,
    };
  } catch (error) {
    console.error("Groq chat failed:", error);
    return {
      response: `${buildInsightFallback(snapshot)} I couldn't reach the AI model just now, so I'm falling back to your live summary.`,
      source: "fallback" as const,
    };
  }
}

function buildReportFallback(snapshot: DashboardSnapshot) {
  const breakdownLines =
    snapshot.breakdown.length === 0
      ? "- No category data available yet."
      : snapshot.breakdown
          .map(
            (item) =>
              `- ${toReadableCategory(item.category)}: ${item.kg.toFixed(1)} kg CO2e (${item.sharePct.toFixed(1)}%)`,
          )
          .join("\n");

  const recentLines =
    snapshot.recentEntries.length === 0
      ? "- No recent entries available."
      : snapshot.recentEntries
          .map(
            (entry) =>
              `- ${toReadableCategory(entry.category)} / ${entry.subcategory.replace(/_/g, " ")}: ${entry.carbon_equivalent.toFixed(2)} kg on ${new Date(
                entry.date,
              ).toLocaleDateString("en-US")}`,
          )
          .join("\n");

  return `# Official Aether-Carbon Audit
*Generated for ${snapshot.user.name}*

## Executive Summary
This month you have logged **${snapshot.totals.monthKg.toFixed(1)} kg CO2e** across **${snapshot.totals.entryCount}** activities. Your highest-impact category is **${snapshot.topCategory.category === "NONE" ? "not available yet" : toReadableCategory(snapshot.topCategory.category)}**.

Compared with the previous month, your emissions changed by **${snapshot.totals.monthDeltaPct.toFixed(1)}%**. You currently have **${snapshot.budget.budgetLeftKg.toFixed(1)} kg** left against your monthly target.

## Category Intensity Analysis
${breakdownLines}

## Recent Ledger Signals
${recentLines}

## Reduction Roadmap
1. Prioritize the top category first because it gives the fastest measurable reduction.
2. Review the last 7 days and replace one repeat high-impact action with a lower-carbon alternative.
3. Use the quick-add dashboard panel consistently so trend analysis stays accurate.
`;
}

export async function generateAuditReport(snapshot: DashboardSnapshot) {
  const client = getClient();
  if (!client) {
    return {
      markdown: buildReportFallback(snapshot),
      source: "fallback" as const,
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: REPORT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a senior sustainability analyst. Produce a markdown audit with specific observations and practical recommendations. Do not invent data beyond the provided context.",
        },
        {
          role: "user",
          content: JSON.stringify(snapshot, null, 2),
        },
      ],
    });

    return {
      markdown:
        completion.choices[0]?.message?.content?.trim() ||
        buildReportFallback(snapshot),
      source: "groq" as const,
    };
  } catch (error) {
    console.error("Groq report generation failed:", error);
    return {
      markdown: buildReportFallback(snapshot),
      source: "fallback" as const,
    };
  }
}

function sanitizeCategory(category: string): Category {
  if (Object.values(Category).includes(category as Category)) {
    return category as Category;
  }
  return Category.SHOPPING;
}

function sanitizeReceiptPayload(input: unknown): ReceiptActivity[] {
  if (!input || typeof input !== "object" || !Array.isArray((input as { activities?: unknown[] }).activities)) {
    return [];
  }

  return (input as { activities: unknown[] }).activities.reduce<ReceiptActivity[]>((result, item) => {
    if (!item || typeof item !== "object") {
      return result;
    }

    const candidate = item as Record<string, unknown>;
    const parsed = {
      name: String(candidate.name || "Receipt item"),
      category: sanitizeCategory(String(candidate.category || Category.SHOPPING)),
      subcategory: String(candidate.subcategory || "clothing"),
      value: Number(candidate.value || 1),
      unit: String(candidate.unit || "items"),
      carbon_equivalent: Number(candidate.carbon_equivalent || 0),
      insight_hint: candidate.insight_hint ? String(candidate.insight_hint) : undefined,
    };

    if (Number.isFinite(parsed.value) && parsed.value > 0) {
      result.push(parsed);
    }

    return result;
  }, []);
}

function buildReceiptFallback() {
  return [
    {
      name: "Scanned purchase",
      category: Category.SHOPPING,
      subcategory: "clothing",
      value: 1,
      unit: "items",
      carbon_equivalent: 15,
      insight_hint: "Review the detected receipt details before saving and adjust the category if needed.",
    },
  ];
}

export async function extractReceiptActivities(imageDataUrl: string) {
  const client = getClient();
  if (!client) {
    return {
      activities: buildReceiptFallback(),
      source: "fallback" as const,
    };
  }

  for (const model of VISION_MODELS) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Return JSON only in the shape {"activities":[{"name":"","category":"","subcategory":"","value":0,"unit":"","carbon_equivalent":0,"insight_hint":""}]}.
Map every extracted line item to one of: TRANSPORT, ENERGY, FOOD, WASTE, SHOPPING, WATER.
Use reasonable carbon_equivalent estimates in kilograms.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      const activities = sanitizeReceiptPayload(content ? JSON.parse(content) : null);

      if (activities.length > 0) {
        return {
          activities,
          source: "groq" as const,
        };
      }
    } catch (error) {
      console.error(`Groq OCR failed for model ${model}:`, error);
    }
  }

  return {
    activities: buildReceiptFallback(),
    source: "fallback" as const,
  };
}
