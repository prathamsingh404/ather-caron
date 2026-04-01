import { Activity, Category, User } from "@prisma/client";

type ActivityWithCategory = Pick<Activity, "id" | "category" | "subcategory" | "carbon_equivalent" | "raw_value" | "unit" | "date" | "facility" | "source">;

export interface DashboardSnapshot {
  totals: {
    todayKg: number;
    monthKg: number;
    previousMonthKg: number;
    monthDeltaPct: number;
    rollingSevenDaysKg: number;
    entryCount: number;
  };
  budget: {
    monthlyTargetKg: number;
    budgetLeftKg: number;
  };
  topCategory: {
    category: Category | "NONE";
    kg: number;
    sharePct: number;
  };
  breakdown: Array<{
    category: Category;
    kg: number;
    sharePct: number;
  }>;
  recentEntries: ActivityWithCategory[];
  trend: Array<{
    day: string;
    total: number;
    transport: number;
    energy: number;
    food: number;
    waste: number;
    shopping: number;
    water: number;
  }>;
  streakDays: number;
  insightFallback: string;
  user: {
    name: string;
    annualBudgetKg: number;
  };
}

const CATEGORY_KEYS = [
  Category.TRANSPORT,
  Category.ENERGY,
  Category.FOOD,
  Category.WASTE,
  Category.SHOPPING,
  Category.WATER,
] as const;

function isSameDay(date: Date, target: Date) {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function sumKg(items: ActivityWithCategory[]) {
  return +items.reduce((sum, item) => sum + (item.carbon_equivalent || 0), 0).toFixed(2);
}

function toPercent(part: number, total: number) {
  if (!total) return 0;
  return +((part / total) * 100).toFixed(1);
}

function buildTrend(activities: ActivityWithCategory[]) {
  const now = new Date();
  const trendMap = new Map<string, DashboardSnapshot["trend"][number]>();

  for (let i = 6; i >= 0; i -= 1) {
    const current = new Date(now);
    current.setDate(now.getDate() - i);
    const label = current.toLocaleDateString("en-US", { weekday: "short" });
    trendMap.set(label, {
      day: label,
      total: 0,
      transport: 0,
      energy: 0,
      food: 0,
      waste: 0,
      shopping: 0,
      water: 0,
    });
  }

  activities.forEach((activity) => {
    const date = new Date(activity.date);
    const diff = now.getTime() - date.getTime();
    if (diff < 0 || diff > 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    const record = trendMap.get(label);
    if (!record) {
      return;
    }

    const kg = +(activity.carbon_equivalent || 0).toFixed(2);
    record.total += kg;
    const categoryKeyMap = {
      [Category.TRANSPORT]: "transport",
      [Category.ENERGY]: "energy",
      [Category.FOOD]: "food",
      [Category.WASTE]: "waste",
      [Category.SHOPPING]: "shopping",
      [Category.WATER]: "water",
    } as const;
    const categoryKey = categoryKeyMap[activity.category];
    record[categoryKey] += kg;
  });

  return Array.from(trendMap.values()).map((item) => ({
    ...item,
    total: +item.total.toFixed(2),
    transport: +item.transport.toFixed(2),
    energy: +item.energy.toFixed(2),
    food: +item.food.toFixed(2),
    waste: +item.waste.toFixed(2),
    shopping: +item.shopping.toFixed(2),
    water: +item.water.toFixed(2),
  }));
}

function calculateStreakDays(activities: ActivityWithCategory[]) {
  const uniqueDays = Array.from(
    new Set(
      activities.map((activity) =>
        new Date(activity.date).toISOString().slice(0, 10),
      ),
    ),
  ).sort((left, right) => right.localeCompare(left));

  if (uniqueDays.length === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const expected = cursor.toISOString().slice(0, 10);
    if (!uniqueDays.includes(expected)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function buildDashboardSnapshot(user: User, activities: ActivityWithCategory[]): DashboardSnapshot {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);

  const monthActivities = activities.filter((activity) => new Date(activity.date) >= startOfMonth);
  const previousMonthActivities = activities.filter((activity) => {
    const date = new Date(activity.date);
    return date >= startOfPreviousMonth && date <= endOfPreviousMonth;
  });
  const todayActivities = activities.filter((activity) => isSameDay(new Date(activity.date), now));
  const sevenDayActivities = activities.filter((activity) => new Date(activity.date) >= sevenDaysAgo);

  const breakdown = CATEGORY_KEYS.map((category) => {
    const kg = +monthActivities
      .filter((activity) => activity.category === category)
      .reduce((sum, activity) => sum + (activity.carbon_equivalent || 0), 0)
      .toFixed(2);

    return { category, kg, sharePct: 0 };
  })
    .filter((item) => item.kg > 0)
    .sort((left, right) => right.kg - left.kg);

  const monthKg = sumKg(monthActivities);
  breakdown.forEach((item) => {
    item.sharePct = toPercent(item.kg, monthKg || 1);
  });

  const previousMonthKg = sumKg(previousMonthActivities);
  const monthDeltaPct =
    previousMonthKg === 0
      ? monthKg > 0
        ? 100
        : 0
      : +(((monthKg - previousMonthKg) / previousMonthKg) * 100).toFixed(1);

  const topCategory = breakdown[0]
    ? {
        category: breakdown[0].category,
        kg: breakdown[0].kg,
        sharePct: breakdown[0].sharePct,
      }
    : {
        category: "NONE" as const,
        kg: 0,
        sharePct: 0,
      };

  const monthlyTargetKg = +((user.carbon_budget || 2000) / 12).toFixed(1);
  const budgetLeftKg = +(monthlyTargetKg - monthKg).toFixed(1);
  const insightFallback =
    topCategory.category === "NONE"
      ? "Log your first few activities to unlock AI coaching and category-level recommendations."
      : `${topCategory.category.toLowerCase()} is your biggest source this month at ${topCategory.kg.toFixed(
          1,
        )} kg CO2e. Focus there first for the fastest reduction.`;

  return {
    totals: {
      todayKg: sumKg(todayActivities),
      monthKg,
      previousMonthKg,
      monthDeltaPct,
      rollingSevenDaysKg: sumKg(sevenDayActivities),
      entryCount: activities.length,
    },
    budget: {
      monthlyTargetKg,
      budgetLeftKg,
    },
    topCategory,
    breakdown,
    recentEntries: activities.slice(0, 6),
    trend: buildTrend(activities),
    streakDays: calculateStreakDays(activities),
    insightFallback,
    user: {
      name: user.name || "Carbon User",
      annualBudgetKg: user.carbon_budget || 2000,
    },
  };
}
