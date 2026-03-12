import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Table } from './entities/table.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Ingredient } from './entities/ingredient.entity';
import { StockMovement } from './entities/stock-movement.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'kenbon',
  password: process.env.DB_PASSWORD || 'kenbon',
  database: process.env.DB_NAME || 'kenbon_restaurant',
  synchronize: false,
  entities: [Role, User, MenuCategory, MenuItem, Table, Order, OrderItem, Payment, Ingredient, StockMovement],
});

async function seed() {
  await dataSource.initialize();

  const rolesRepo = dataSource.getRepository(Role);
  const usersRepo = dataSource.getRepository(User);
  const categoriesRepo = dataSource.getRepository(MenuCategory);
  const itemsRepo = dataSource.getRepository(MenuItem);
  const tablesRepo = dataSource.getRepository(Table);
  const ingredientsRepo = dataSource.getRepository(Ingredient);

  // Roles
  const roleNames = ['ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'CASHIER', 'DELIVERY', 'CUSTOMER'];
  const roles: Record<string, Role> = {};
  for (const name of roleNames) {
    let role = await rolesRepo.findOne({ where: { name } });
    if (!role) {
      role = rolesRepo.create({ name, description: name });
      await rolesRepo.save(role);
    }
    roles[name] = role;
  }
  console.log('Roles ready');

  // Admin user
  let admin = await usersRepo.findOne({ where: { email: 'admin@kenbon.com' } });
  if (!admin) {
    admin = usersRepo.create({
      email: 'admin@kenbon.com',
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      roles: [roles['ADMIN']],
    });
    await usersRepo.save(admin);
    console.log('Admin user created: admin@kenbon.com / admin123');
  } else {
    console.log('Admin user already exists');
  }

  // Categories
  const categoryData = [
    { name: 'Starters', description: 'Appetizers and small plates' },
    { name: 'Mains', description: 'Main courses' },
    { name: 'Desserts', description: 'Sweet treats' },
    { name: 'Drinks', description: 'Beverages' },
  ];
  const categories: Record<string, MenuCategory> = {};
  for (const c of categoryData) {
    let cat = await categoriesRepo.findOne({ where: { name: c.name } });
    if (!cat) {
      cat = categoriesRepo.create(c);
      await categoriesRepo.save(cat);
    }
    categories[c.name] = cat;
  }
  console.log('Categories ready');

  // Menu items
  const itemData = [
    { name: 'Spring Rolls', description: 'Fresh vegetable spring rolls', price: '4.99', category: 'Starters' },
    { name: 'Soup of the Day', description: 'Chef\'s daily special', price: '5.99', category: 'Starters' },
    { name: 'Chicken Teriyaki', description: 'Grilled chicken with teriyaki sauce', price: '14.99', category: 'Mains' },
    { name: 'Beef Stir Fry', description: 'Tender beef with vegetables', price: '16.99', category: 'Mains' },
    { name: 'Vegetable Curry', description: 'Mixed vegetables in coconut curry', price: '12.99', category: 'Mains' },
    { name: 'Ice Cream', description: 'Vanilla, chocolate, or strawberry', price: '5.99', category: 'Desserts' },
    { name: 'Cheesecake', description: 'Classic New York style', price: '7.99', category: 'Desserts' },
    { name: 'Green Tea', description: 'Hot or iced', price: '2.99', category: 'Drinks' },
    { name: 'Soda', description: 'Cola, lemonade, or orange', price: '2.49', category: 'Drinks' },
    { name: 'Fresh Juice', description: 'Orange, apple, or mango', price: '3.99', category: 'Drinks' },
  ];
  for (const i of itemData) {
    const exists = await itemsRepo.findOne({ where: { name: i.name } });
    if (!exists) {
      const item = itemsRepo.create({
        name: i.name,
        description: i.description,
        price: i.price,
        category: categories[i.category],
      });
      await itemsRepo.save(item);
    }
  }
  console.log('Menu items ready');

  // Tables
  for (let n = 1; n <= 10; n++) {
    const label = `T${n}`;
    const exists = await tablesRepo.findOne({ where: { label } });
    if (!exists) {
      await tablesRepo.save(tablesRepo.create({ label, capacity: 4, isActive: true }));
    }
  }
  console.log('Tables ready (T1–T10)');

  // Ingredients
  const ingredientData = [
    { name: 'Chicken', unit: 'kg', quantity: '10', alertLevel: '2' },
    { name: 'Beef', unit: 'kg', quantity: '5', alertLevel: '1' },
    { name: 'Tomato', unit: 'kg', quantity: '8', alertLevel: '2' },
    { name: 'Cheese', unit: 'kg', quantity: '5', alertLevel: '1' },
    { name: 'Rice', unit: 'kg', quantity: '20', alertLevel: '5' },
  ];
  for (const ing of ingredientData) {
    const exists = await ingredientsRepo.findOne({ where: { name: ing.name } });
    if (!exists) {
      await ingredientsRepo.save(ingredientsRepo.create(ing));
    }
  }
  console.log('Ingredients ready');

  await dataSource.destroy();
  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
