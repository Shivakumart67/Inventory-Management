import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import ExpenseCategory from '../models/ExpenseCategory';
import StockSummary from '../models/StockSummary';
import SiteConfig from '../models/SiteConfig';

dotenv.config();

const SEED_CATEGORIES = [
  'Labour / Worker Payment',
  'Maintenance',
  'Construction / Repair',
  'Transport',
  'Utilities',
  'Medicine / Health',
  'Equipment',
  'Food',
  'Miscellaneous'
];

async function seed() {
  const mongoUri: any = process.env.MONGO_URI;
  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB for seeding.');

    // 1. Seed Users
    const adminUsername = 'admin';
    const managerUsername = 'manager';

    const existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        name: 'Admin',
        username: adminUsername,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        mobile: '1234567890',
        email: 'admin@inventoryapp.com',
        address: 'Golder Egg Farm'
      });
      await newAdmin.save();
      console.log('Admin user seeded: admin / admin123');
    } else {
      console.log('Admin user already exists.');
    }

    const existingManager = await User.findOne({ username: managerUsername });
    if (!existingManager) {
      const passwordHash = await bcrypt.hash('manager123', 10);
      const newManager = new User({
        name: 'Farm Incharge',
        username: managerUsername,
        passwordHash,
        role: 'MANAGER',
        status: 'ACTIVE',
        mobile: '0987654321',
        email: 'manager@inventoryapp.com',
        address: 'Golder Egg farm'
      });
      await newManager.save();
      console.log('Manager user seeded: manager / manager123');
    } else {
      console.log('Manager user already exists.');
    }

    // 2. Seed Expense Categories
    for (const catName of SEED_CATEGORIES) {
      const exists = await ExpenseCategory.findOne({ name: catName });
      if (!exists) {
        await new ExpenseCategory({ name: catName }).save();
        console.log(`Expense Category seeded: ${catName}`);
      }
    }

    // 3. Seed Stock Summary
    const stockSummaryExists = await StockSummary.findOne();
    if (!stockSummaryExists) {
      await new StockSummary({
        currentStock: 0,
        totalInwardQuantity: 0,
        totalOutwardQuantity: 0,
        lastUpdated: new Date()
      }).save();
      console.log('Stock Summary initialized with 0 units.');
    } else {
      console.log('Stock Summary already initialized.');
    }

    // 4. Seed default Site Config
    const configExists = await SiteConfig.findOne();
    if (!configExists) {
      await new SiteConfig({
        companyName: 'Golden Egg Layer Farm',
        currency: 'INR',
        currencySymbol: '₹'
      }).save();
      console.log('Site Config seeded with Golden Egg Layer Farm.');
    } else {
      console.log('Site Config already exists.');
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

seed();
