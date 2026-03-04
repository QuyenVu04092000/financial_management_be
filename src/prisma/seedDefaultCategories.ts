// File: src/prisma/seedDefaultCategories.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Default financial categories to seed
 */
interface DefaultCategoryData {
  id: string;
  name: string;
  purpose: string;
  formulaHint: string;
  note: string;
}

const defaultCategories: DefaultCategoryData[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    purpose: 'Savings for unexpected expenses and emergencies',
    formulaHint: 'Target: 3-6 months of expenses',
    note: 'Keep this fund separate and easily accessible',
  },
  {
    id: '2',
    name: 'Fixed Costs',
    purpose: 'Recurring monthly expenses that remain constant',
    formulaHint: 'Sum of all fixed monthly bills (rent, utilities, insurance, etc.)',
    note: "Track these to ensure they don't exceed your income",
  },
  {
    id: '3',
    name: 'Groceries / Food',
    purpose: 'Food and grocery expenses',
    formulaHint: 'Monthly average: (Weekly grocery × 4) + Dining out',
    note: 'Try to meal plan to reduce costs',
  },
  {
    id: '4',
    name: 'Living Expenses',
    purpose: 'Day-to-day living costs and variable expenses',
    formulaHint: 'Transportation + Personal care + Household items',
    note: 'Review monthly to identify areas for savings',
  },
  {
    id: '5',
    name: 'Investments',
    purpose: 'Money allocated for long-term growth and wealth building',
    formulaHint: 'Recommended: 20% of income (after expenses)',
    note: 'Diversify across different asset classes',
  },
  {
    id: '6',
    name: 'Fun / Entertainment',
    purpose: 'Leisure activities, hobbies, and entertainment',
    formulaHint: 'Budget: 5-10% of disposable income',
    note: 'Balance enjoyment with financial goals',
  },
];

/**
 * Seeds default categories into the database
 * Creates a system user if it doesn't exist, then creates default categories
 */
async function seedDefaultCategories() {
  try {
    console.log('🌱 Starting to seed default categories...');

    // Check if system user exists, create if not
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@default.categories' },
    });

    if (!systemUser) {
      console.log('📝 Creating system user for default categories...');
      systemUser = await prisma.user.create({
        data: {
          id: 'system-user-default',
          name: 'System',
          email: 'system@default.categories',
          phone: '0000000000',
          password: 'system-password-not-used',
          status: 'ACTIVE',
        },
      });
      console.log('✅ System user created');
    }

    // Check which categories already exist
    const existingCategories = await prisma.category.findMany({
      where: {
        userId: systemUser.id,
        isDefault: true,
      },
    });

    const existingNames = new Set(existingCategories.map((c) => c.name));

    // Create categories that don't exist
    let createdCount = 0;
    for (const categoryData of defaultCategories) {
      if (existingNames.has(categoryData.name)) {
        console.log(`⏭️  Category "${categoryData.name}" already exists, skipping...`);
        continue;
      }

      await prisma.category.create({
        data: {
          id: categoryData.id,
          name: categoryData.name,
          userId: systemUser.id,
          purpose: categoryData.purpose,
          formulaHint: categoryData.formulaHint,
          note: categoryData.note,
          isDefault: true,
        },
      });

      createdCount++;
      console.log(`✅ Created category: ${categoryData.name}`);
    }

    console.log(`\n🎉 Seeding completed! Created ${createdCount} new categories.`);
    console.log(`📊 Total default categories: ${existingCategories.length + createdCount}`);
  } catch (error) {
    console.error('❌ Error seeding default categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDefaultCategories()
  .then(() => {
    console.log('✨ Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });
