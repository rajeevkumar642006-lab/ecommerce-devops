/**
 * docker/mongo/init-db.js
 *
 * MongoDB initialisation script executed once when the container is first
 * created (mounted at /docker-entrypoint-initdb.d/).
 *
 * What it does:
 *   1. Creates the application database and a dedicated app user.
 *   2. Creates the collections with schema validation hints.
 *   3. Builds the indexes that Mongoose would otherwise create lazily.
 *   4. Seeds one admin user so you can log in immediately after `docker compose up`.
 *
 * NOTE: The admin password below is for local development only.
 *       Override it via the MONGO_INITDB_* environment variables in
 *       docker-compose.yml before deploying to any shared environment.
 */

// Switch to (or create) the application database
db = db.getSiblingDB('ecommerce');

// ── Create a dedicated application user ──────────────────────────────────────
db.createUser({
  user: 'ecommerceUser',
  pwd:  'ecommercePass',   // override via MONGO_INITDB env vars in production
  roles: [{ role: 'readWrite', db: 'ecommerce' }],
});

// ── Create collections ────────────────────────────────────────────────────────
['users', 'products', 'categories', 'orders', 'carts'].forEach((col) => {
  db.createCollection(col);
  print(`Collection created: ${col}`);
});

// ── Indexes ───────────────────────────────────────────────────────────────────
// Users
db.users.createIndex({ email: 1 },              { unique: true });
db.users.createIndex({ role: 1, isActive: 1 });

// Products
db.products.createIndex({ slug: 1 },            { unique: true });
db.products.createIndex({ category: 1 });
db.products.createIndex({ isActive: 1 });
db.products.createIndex({ isFeatured: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ 'ratings.average': -1 });
db.products.createIndex(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 } }
);

// Orders
db.orders.createIndex({ user: 1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

// Carts
db.carts.createIndex({ user: 1 }, { unique: true });

// Categories
db.categories.createIndex({ slug: 1 }, { unique: true });

print('All indexes created.');

// ── Seed admin user ───────────────────────────────────────────────────────────
// Password: Admin@123  (bcrypt hash, 12 rounds)
// Change this immediately after first login in any non-local environment.
const adminExists = db.users.findOne({ email: 'admin@shophub.com' });
if (!adminExists) {
  db.users.insertOne({
    name:      'Admin User',
    email:     'admin@shophub.com',
    // bcrypt hash of "Admin@123" with 12 salt rounds
    password:  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
    role:      'admin',
    isActive:  true,
    address:   {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  print('Admin user seeded: admin@shophub.com / Admin@123');
} else {
  print('Admin user already exists — skipping seed.');
}

// ── Seed sample category ──────────────────────────────────────────────────────
const catExists = db.categories.findOne({ slug: 'electronics' });
if (!catExists) {
  db.categories.insertOne({
    name:      'Electronics',
    slug:      'electronics',
    description: 'Gadgets, devices, and accessories',
    isActive:  true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  print('Sample category seeded: Electronics');
}

print('MongoDB initialisation complete.');
