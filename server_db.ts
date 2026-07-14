import fs from 'fs';
import path from 'path';
import xmlrpc from 'xmlrpc';
import { Pool } from 'pg';
import { OdooConfig, ProductCommission, CommissionSaleOrder, CommissionSaleOrderLine, CommissionType } from './src/types';

const DB_PATH = path.join(process.cwd(), 'data', 'commission_db.json');

interface DbSchema {
  config: OdooConfig;
  productCommissions: ProductCommission[];
  salesOrders: CommissionSaleOrder[];
}

const DEFAULT_DB: DbSchema = {
  config: {
    url: '',
    db: '',
    username: '',
    password: '',
    isDemo: true, // Defaults to Demo Mode for instant usability
    isConnected: false,
  },
  productCommissions: [
    { id: 101, name: 'Laptop Pro 15"', default_code: 'LAP-15-PRO', list_price: 1200, commission_type: 'percentage', commission_value: 5 },
    { id: 102, name: 'Soporte de Laptop Ergonómico', default_code: 'SUP-ERG-01', list_price: 45, commission_type: 'fixed', commission_value: 5 }, // 5 Soles
    { id: 103, name: 'Monitor Ultrawide 34"', default_code: 'MON-34-UW', list_price: 650, commission_type: 'percentage', commission_value: 3 },
    { id: 104, name: 'Teclado Mecánico RGB', default_code: 'KEY-MECH-RGB', list_price: 120, commission_type: 'fixed', commission_value: 10 }, // 10 Soles
    { id: 105, name: 'Mouse Inalámbrico Ergo', default_code: 'MSE-ERGO-W', list_price: 60, commission_type: 'none', commission_value: 0 },
    { id: 106, name: 'Audífonos Noise Cancelling', default_code: 'AUD-NC-900', list_price: 250, commission_type: 'fixed', commission_value: 15 }, // 15 Soles
    { id: 107, name: 'Silla de Oficina Ejecutiva', default_code: 'CH-EXE-OFF', list_price: 350, commission_type: 'percentage', commission_value: 8 },
    { id: 108, name: 'Escritorio de Madera Roble', default_code: 'DSK-OAK-02', list_price: 500, commission_type: 'percentage', commission_value: 10 }
  ],
  salesOrders: [] // Will generate beautiful demo sales orders if empty and in Demo Mode
};

// Helper to load DB
export function loadDb(): DbSchema {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      saveDb(DEFAULT_DB);
      // Generate demo orders
      const db = { ...DEFAULT_DB };
      db.salesOrders = generateDemoOrders(db.productCommissions);
      saveDb(db);
      return db;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const db: DbSchema = JSON.parse(raw);
    
    // Ensure lists exist
    if (!db.productCommissions) db.productCommissions = [];
    if (!db.salesOrders) db.salesOrders = [];
    if (!db.config) db.config = { ...DEFAULT_DB.config };

    // Ensure multi-company and user profile defaults
    if (!db.config.companies) {
      db.config.companies = [
        { id: 1, name: "Botica Principal S.A.C." },
        { id: 2, name: "Sucursal Sur Droguería" }
      ];
    }
    if (!db.config.userProfiles) {
      db.config.userProfiles = [
        { id: "admin-global", name: "Soporte Técnico (Admin)", email: "soporte@facturaclic.pe", role: "admin" },
        { id: "admin-botica-1", name: "Carlos Ruiz (Admin Botica Principal)", email: "carlos@boticap.pe", role: "company_admin", companyId: 1, companyName: "Botica Principal S.A.C." },
        { id: "cajero-botica-2", name: "Ana Gómez (Cajera Sucursal Sur)", email: "ana.gomez@boticap.pe", role: "cashier", companyId: 2, companyName: "Sucursal Sur Droguería" }
      ];
    }
    if (!db.config.activeProfileId) {
      db.config.activeProfileId = "admin-global";
    }

    // Set demo companies for demo products if empty/none
    db.productCommissions = db.productCommissions.map((p, idx) => {
      if (!p.company_id) {
        return {
          ...p,
          company_id: (idx % 2 === 0) ? 1 : 2,
          company_name: (idx % 2 === 0) ? "Botica Principal S.A.C." : "Sucursal Sur Droguería"
        };
      }
      return p;
    });

    // If database is empty on orders (or config isDemo is true and orders are empty), populate demo orders
    if (db.config.isDemo && db.salesOrders.length === 0) {
      db.salesOrders = generateDemoOrders(db.productCommissions);
      saveDb(db);
    }
    
    return db;
  } catch (e) {
    console.error('Error loading database, returning default:', e);
    return DEFAULT_DB;
  }
}

// Helper to save DB
export function saveDb(db: DbSchema): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving database:', e);
  }
}

// Generate beautiful sample orders for demo mode
function generateDemoOrders(products: ProductCommission[]): CommissionSaleOrder[] {
  const sellers = [
    { id: 11, name: 'Ana Gómez' },
    { id: 12, name: 'Carlos Ruiz' },
    { id: 13, name: 'María Torres' },
    { id: 14, name: 'Juan Herrera' }
  ];

  const orders: CommissionSaleOrder[] = [];
  const now = new Date();
  
  // Create ~15 orders over the last 30 days
  for (let i = 0; i < 15; i++) {
    const seller = sellers[i % sellers.length];
    const orderDate = new Date();
    orderDate.setDate(now.getDate() - (15 - i) * 2 + Math.floor(Math.random() * 2)); // spaced out over 30 days
    
    const lines: CommissionSaleOrderLine[] = [];
    // select 1-3 random products
    const productCount = Math.floor(Math.random() * 2) + 1;
    const selectedProducts: ProductCommission[] = [];
    
    while (selectedProducts.length < productCount) {
      const p = products[Math.floor(Math.random() * products.length)];
      if (!selectedProducts.find(x => x.id === p.id)) {
        selectedProducts.push(p);
      }
    }

    let orderTotal = 0;
    let orderCommission = 0;

    selectedProducts.forEach((prod, idx) => {
      const qty = Math.floor(Math.random() * 2) + 1;
      const priceSubtotal = prod.list_price * qty;
      orderTotal += priceSubtotal;

      // Calculate commission
      let commissionEarned = 0;
      if (prod.commission_type === 'fixed') {
        commissionEarned = prod.commission_value * qty;
      } else if (prod.commission_type === 'percentage') {
        commissionEarned = (prod.list_price * (prod.commission_value / 100)) * qty;
      }

      orderCommission += commissionEarned;

      lines.push({
        id: 1000 + i * 10 + idx,
        product_id: prod.id,
        product_name: prod.name,
        quantity: qty,
        price_unit: prod.list_price,
        price_subtotal: priceSubtotal,
        commission_earned: Math.round(commissionEarned * 100) / 100
      });
    });

    // Assign company 1 or 2 based on pattern
    const companyId = (i % 2 === 0) ? 1 : 2;
    const companyName = (i % 2 === 0) ? "Botica Principal S.A.C." : "Sucursal Sur Droguería";

    orders.push({
      id: 5000 + i,
      name: `SO${String(100 + i).padStart(3, '0')}`,
      date_order: orderDate.toISOString(),
      amount_total: orderTotal,
      salesperson_id: seller.id,
      salesperson_name: seller.name,
      commission_total: Math.round(orderCommission * 100) / 100,
      status: i < 10 ? 'paid' : 'pending', // older orders are marked paid, newer are pending
      lines: lines,
      company_id: companyId,
      company_name: companyName
    });
  }

  return orders;
}

// Recalculates commissions for all 'pending' orders using current product configurations
export function recalculatePendingCommissions(db: DbSchema): void {
  db.salesOrders = db.salesOrders.map(order => {
    if (order.status !== 'pending') return order; // Only recalculate pending ones

    let orderCommission = 0;
    const updatedLines = order.lines.map(line => {
      const productRule = db.productCommissions.find(p => p.id === line.product_id);
      let commissionEarned = 0;
      
      if (productRule) {
        if (productRule.commission_type === 'fixed') {
          commissionEarned = productRule.commission_value * line.quantity;
        } else if (productRule.commission_type === 'percentage') {
          commissionEarned = (line.price_unit * (productRule.commission_value / 100)) * line.quantity;
        }
      }
      
      orderCommission += commissionEarned;
      return {
        ...line,
        commission_earned: Math.round(commissionEarned * 100) / 100
      };
    });

    return {
      ...order,
      commission_total: Math.round(orderCommission * 100) / 100,
      lines: updatedLines
    };
  });
}

// Odoo External API Authentication
export function testOdooConnection(config: OdooConfig): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!config.url || !config.db || !config.username || !config.password) {
      return reject(new Error('Faltan completar campos requeridos para la conexión con Odoo.'));
    }

    try {
      const parsedUrl = new URL(config.url);
      const isHttps = parsedUrl.protocol === 'https:';
      const clientOptions = {
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : (isHttps ? 443 : 80),
        path: '/xmlrpc/2/common'
      };
      
      const client = isHttps ? xmlrpc.createSecureClient(clientOptions) : xmlrpc.createClient(clientOptions);
      
      client.methodCall('authenticate', [config.db, config.username, config.password, {}], (err, uid) => {
        if (err) {
          console.error('Odoo Auth Error:', err);
          return reject(new Error(`Error de red o conexión: ${(err as any).message || 'Error desconocido'}`));
        }
        if (uid === false) {
          return reject(new Error('Credenciales incorrectas o base de datos no válida.'));
        }
        resolve(Number(uid));
      });
    } catch (e: any) {
      reject(new Error(`Formato de URL inválido: ${e.message}`));
    }
  });
}

// Odoo generic API call helper
export function executeKw(
  config: OdooConfig,
  uid: number,
  model: string,
  method: string,
  args: any[],
  kwargs: any = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(config.url);
      const isHttps = parsedUrl.protocol === 'https:';
      const clientOptions = {
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : (isHttps ? 443 : 80),
        path: '/xmlrpc/2/object'
      };
      
      const client = isHttps ? xmlrpc.createSecureClient(clientOptions) : xmlrpc.createClient(clientOptions);
      
      client.methodCall('execute_kw', [config.db, uid, config.password!, model, method, args, kwargs], (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    } catch (e: any) {
      reject(e);
    }
  });
}

// Sync companies from Odoo
export async function syncOdooCompanies(config: OdooConfig, uid: number): Promise<{ id: number, name: string }[]> {
  try {
    const odooCompanies = await executeKw(
      config,
      uid,
      'res.company',
      'search_read',
      [[]],
      {
        fields: ['id', 'name']
      }
    );
    if (Array.isArray(odooCompanies)) {
      return odooCompanies.map((c: any) => ({
        id: Number(c.id),
        name: String(c.name)
      }));
    }
    return [];
  } catch (err) {
    console.error('Error fetching Odoo companies (falling back to empty):', err);
    return [];
  }
}

// Sync products from Odoo 14
export async function syncOdooProducts(config: OdooConfig, uid: number): Promise<ProductCommission[]> {
  try {
    // Sync companies list too
    const odooCompaniesList = await syncOdooCompanies(config, uid);

    // We query 'product.template' or 'product.product' that is saleable
    const odooProducts = await executeKw(
      config,
      uid,
      'product.template',
      'search_read',
      [[['sale_ok', '=', true]]],
      {
        fields: ['id', 'name', 'default_code', 'list_price', 'company_id'],
        limit: 150
      }
    ).catch(async () => {
      // Fallback in case company_id isn't queryable
      return await executeKw(
        config,
        uid,
        'product.template',
        'search_read',
        [[['sale_ok', '=', true]]],
        {
          fields: ['id', 'name', 'default_code', 'list_price'],
          limit: 150
        }
      );
    });

    if (!Array.isArray(odooProducts)) {
      throw new Error('Formato de respuesta de Odoo inválido al obtener productos.');
    }

    const db = loadDb();
    
    // Save updated companies list if we got any
    if (odooCompaniesList && odooCompaniesList.length > 0) {
      db.config.companies = odooCompaniesList;
    }

    const existingCommissions = new Map<number, ProductCommission>();
    db.productCommissions.forEach(p => existingCommissions.set(p.id, p));

    const updatedProducts: ProductCommission[] = odooProducts.map((p: any) => {
      const existing = existingCommissions.get(p.id);
      
      const companyId = Array.isArray(p.company_id) ? Number(p.company_id[0]) : (p.company_id ? Number(p.company_id) : undefined);
      const companyName = Array.isArray(p.company_id) ? String(p.company_id[1]) : undefined;

      return {
        id: p.id,
        name: p.name,
        default_code: p.default_code || '',
        list_price: Number(p.list_price) || 0,
        commission_type: existing ? existing.commission_type : 'none',
        commission_value: existing ? existing.commission_value : 0,
        company_id: companyId,
        company_name: companyName
      };
    });

    db.productCommissions = updatedProducts;
    db.config.lastSyncedProducts = new Date().toISOString();
    saveDb(db);

    // If Supabase integration is active, sync data
    if (db.config.supabase?.isEnabled && db.config.supabase?.connectionString) {
      await uploadLocalDataToSupabase(db).catch(err => {
        console.error('Error al subir productos a Supabase en background:', err);
      });
    }

    return updatedProducts;
  } catch (err: any) {
    console.error('Error syncing products from Odoo:', err);
    throw new Error(`Sincronización de productos fallida: ${err.message}`);
  }
}

// Sync sales orders from Odoo 14 POS (pos.order)
export async function syncOdooSales(config: OdooConfig, uid: number): Promise<CommissionSaleOrder[]> {
  try {
    // 1. Fetch sales orders from POS ('pos.order') in 'paid', 'done' or 'invoiced' state
    const odooOrders = await executeKw(
      config,
      uid,
      'pos.order',
      'search_read',
      [[['state', 'in', ['paid', 'done', 'invoiced']]]],
      {
        fields: ['id', 'name', 'date_order', 'amount_total', 'user_id', 'lines', 'company_id'],
        limit: 100,
        order: 'date_order desc'
      }
    ).catch(async () => {
      // Fallback if company_id is not queryable
      return await executeKw(
        config,
        uid,
        'pos.order',
        'search_read',
        [[['state', 'in', ['paid', 'done', 'invoiced']]]],
        {
          fields: ['id', 'name', 'date_order', 'amount_total', 'user_id', 'lines'],
          limit: 100,
          order: 'date_order desc'
        }
      );
    });

    if (!Array.isArray(odooOrders)) {
      throw new Error('Formato de respuesta de Odoo inválido al obtener órdenes del Punto de Venta.');
    }

    if (odooOrders.length === 0) {
      return [];
    }

    // 2. Fetch all order lines belonging to these orders (pos.order.line)
    const orderLineIds = odooOrders.flatMap((order: any) => order.lines || []);
    let odooLines: any[] = [];
    if (orderLineIds.length > 0) {
      odooLines = await executeKw(
        config,
        uid,
        'pos.order.line',
        'search_read',
        [[['id', 'in', orderLineIds]]],
        {
          fields: ['id', 'order_id', 'product_id', 'qty', 'price_unit', 'price_subtotal']
        }
      );
    }

    const linesByOrder = new Map<number, any[]>();
    odooLines.forEach((line: any) => {
      const orderId = Array.isArray(line.order_id) ? line.order_id[0] : line.order_id;
      if (orderId) {
        if (!linesByOrder.has(orderId)) {
          linesByOrder.set(orderId, []);
        }
        linesByOrder.get(orderId)!.push(line);
      }
    });

    // Load database to match commission rules
    const db = loadDb();
    const productRules = new Map<number, ProductCommission>();
    db.productCommissions.forEach(p => productRules.set(p.id, p));

    // Map existing orders to preserve commission 'paid' status
    const existingOrdersMap = new Map<number, CommissionSaleOrder>();
    db.salesOrders.forEach(o => existingOrdersMap.set(o.id, o));

    const syncedOrders: CommissionSaleOrder[] = odooOrders.map((order: any) => {
      const orderId = order.id;
      const existing = existingOrdersMap.get(orderId);
      
      // Determine salesperson
      let salespersonId = 999;
      let salespersonName = 'Cajero General';
      if (Array.isArray(order.user_id)) {
        salespersonId = order.user_id[0];
        salespersonName = order.user_id[1];
      }

      // Determine company details
      const companyId = Array.isArray(order.company_id) ? Number(order.company_id[0]) : (order.company_id ? Number(order.company_id) : undefined);
      const companyName = Array.isArray(order.company_id) ? String(order.company_id[1]) : undefined;

      // Format lines and calculate commissions
      const rawLines = linesByOrder.get(orderId) || [];
      let orderCommissionTotal = 0;

      const lines: CommissionSaleOrderLine[] = rawLines.map((line: any) => {
        let productId = 0;
        let productName = 'Producto Desconocido';
        if (Array.isArray(line.product_id)) {
          productId = line.product_id[0];
          productName = line.product_id[1];
        }

        const qty = Number(line.qty) || 0;
        const priceUnit = Number(line.price_unit) || 0;
        const subtotal = Number(line.price_subtotal) || (qty * priceUnit);

        // Find commission rule
        const rule = productRules.get(productId);
        let commissionEarned = 0;
        if (rule) {
          if (rule.commission_type === 'fixed') {
            commissionEarned = rule.commission_value * qty;
          } else if (rule.commission_type === 'percentage') {
            commissionEarned = (priceUnit * (rule.commission_value / 100)) * qty;
          }
        }

        orderCommissionTotal += commissionEarned;

        return {
          id: line.id,
          product_id: productId,
          product_name: productName,
          quantity: qty,
          price_unit: priceUnit,
          price_subtotal: subtotal,
          commission_earned: Math.round(commissionEarned * 100) / 100
        };
      });

      return {
        id: orderId,
        name: order.name,
        date_order: order.date_order || new Date().toISOString(),
        amount_total: Number(order.amount_total) || 0,
        salesperson_id: salespersonId,
        salesperson_name: salespersonName,
        commission_total: Math.round(orderCommissionTotal * 100) / 100,
        status: existing ? existing.status : 'pending', // preserve paid status if synced before
        lines: lines,
        company_id: companyId,
        company_name: companyName
      };
    });

    db.salesOrders = syncedOrders;
    db.config.lastSyncedSales = new Date().toISOString();
    saveDb(db);

    // If Supabase integration is active, sync data
    if (db.config.supabase?.isEnabled && db.config.supabase?.connectionString) {
      await uploadLocalDataToSupabase(db).catch(err => {
        console.error('Error al subir ventas a Supabase en background:', err);
      });
    }

    return syncedOrders;
  } catch (err: any) {
    console.error('Error syncing sales orders from Odoo POS:', err);
    throw new Error(`Sincronización de ventas fallida: ${err.message}`);
  }
}

// === Supabase/PostgreSQL Integration Client ===
let supabasePool: Pool | null = null;
let currentConnectionString = '';

export function getSupabasePool(connectionString: string): Pool {
  const sanitizedString = connectionString.trim();
  if (supabasePool && currentConnectionString === sanitizedString) {
    return supabasePool;
  }
  
  if (supabasePool) {
    supabasePool.end().catch(err => console.error('Error al cerrar pool anterior:', err));
  }

  supabasePool = new Pool({
    connectionString: sanitizedString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase cloud PostgreSQL
    }
  });
  
  currentConnectionString = sanitizedString;
  return supabasePool;
}

// Test Supabase connection
export async function testSupabaseConnection(connectionString: string): Promise<boolean> {
  const pool = getSupabasePool(connectionString);
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    return true;
  } catch (err) {
    console.error('Error de conexión a Supabase:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Initialize tables in Supabase
export async function initSupabaseTables(connectionString: string): Promise<void> {
  const pool = getSupabasePool(connectionString);
  const client = await pool.connect();
  try {
    // 1. Create table for companies
    await client.query(`
      CREATE TABLE IF NOT EXISTS odoo_companies (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);

    // 2. Create table for user profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        company_id INT,
        company_name VARCHAR(255)
      );
    `);

    // 3. Create table for products
    await client.query(`
      CREATE TABLE IF NOT EXISTS odoo_products (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        default_code VARCHAR(100),
        list_price DECIMAL(12, 2) DEFAULT 0,
        commission_type VARCHAR(50) DEFAULT 'none',
        commission_value DECIMAL(12, 2) DEFAULT 0,
        company_id INT,
        company_name VARCHAR(255)
      );
    `);

    // 4. Create table for sales orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS odoo_pos_sales (
        id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        date_order TIMESTAMP NOT NULL,
        amount_total DECIMAL(12, 2) DEFAULT 0,
        salesperson_id INT DEFAULT 999,
        salesperson_name VARCHAR(255) DEFAULT 'Cajero General',
        commission_total DECIMAL(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        company_id INT,
        company_name VARCHAR(255)
      );
    `);

    // 5. Create table for sales lines
    await client.query(`
      CREATE TABLE IF NOT EXISTS odoo_pos_lines (
        id INT PRIMARY KEY,
        order_id INT REFERENCES odoo_pos_sales(id) ON DELETE CASCADE,
        product_id INT,
        product_name VARCHAR(255),
        quantity DECIMAL(12, 2) DEFAULT 0,
        price_unit DECIMAL(12, 2) DEFAULT 0,
        price_subtotal DECIMAL(12, 2) DEFAULT 0,
        commission_earned DECIMAL(12, 2) DEFAULT 0
      );
    `);

    // Upgrade existing tables safely with IF NOT EXISTS column additions
    try {
      await client.query('ALTER TABLE odoo_products ADD COLUMN IF NOT EXISTS company_id INT');
      await client.query('ALTER TABLE odoo_products ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)');
    } catch (e) {}

    try {
      await client.query('ALTER TABLE odoo_pos_sales ADD COLUMN IF NOT EXISTS company_id INT');
      await client.query('ALTER TABLE odoo_pos_sales ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)');
    } catch (e) {}

    console.log('Tablas de Supabase inicializadas correctamente con soporte multi-compañía.');
  } catch (err) {
    console.error('Error al inicializar tablas en Supabase:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Upload all local data to Supabase (Upload)
export async function uploadLocalDataToSupabase(db: DbSchema): Promise<void> {
  if (!db.config.supabase?.isEnabled || !db.config.supabase?.connectionString) {
    return;
  }

  const pool = getSupabasePool(db.config.supabase.connectionString);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Sync companies list to Supabase
    if (db.config.companies && db.config.companies.length > 0) {
      for (const comp of db.config.companies) {
        await client.query(`
          INSERT INTO odoo_companies (id, name)
          VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `, [comp.id, comp.name]);
      }
    }

    // 2. Sync profiles list to Supabase
    if (db.config.userProfiles && db.config.userProfiles.length > 0) {
      for (const prof of db.config.userProfiles) {
        await client.query(`
          INSERT INTO user_profiles (id, name, email, role, company_id, company_name)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            company_id = EXCLUDED.company_id,
            company_name = EXCLUDED.company_name
        `, [prof.id, prof.name, prof.email, prof.role, prof.companyId || null, prof.companyName || null]);
      }
    }

    // 3. Upload products
    for (const product of db.productCommissions) {
      await client.query(`
        INSERT INTO odoo_products (id, name, default_code, list_price, commission_type, commission_value, company_id, company_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          default_code = EXCLUDED.default_code,
          list_price = EXCLUDED.list_price,
          commission_type = EXCLUDED.commission_type,
          commission_value = EXCLUDED.commission_value,
          company_id = EXCLUDED.company_id,
          company_name = EXCLUDED.company_name
      `, [product.id, product.name, product.default_code || '', product.list_price, product.commission_type, product.commission_value, product.company_id || null, product.company_name || null]);
    }

    // 4. Upload sales
    for (const sale of db.salesOrders) {
      await client.query(`
        INSERT INTO odoo_pos_sales (id, name, date_order, amount_total, salesperson_id, salesperson_name, commission_total, status, company_id, company_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          date_order = EXCLUDED.date_order,
          amount_total = EXCLUDED.amount_total,
          salesperson_id = EXCLUDED.salesperson_id,
          salesperson_name = EXCLUDED.salesperson_name,
          commission_total = EXCLUDED.commission_total,
          status = EXCLUDED.status,
          company_id = EXCLUDED.company_id,
          company_name = EXCLUDED.company_name
      `, [sale.id, sale.name, sale.date_order, sale.amount_total, sale.salesperson_id, sale.salesperson_name, sale.commission_total, sale.status, sale.company_id || null, sale.company_name || null]);

      // Upload lines for this sale
      for (const line of sale.lines) {
        await client.query(`
          INSERT INTO odoo_pos_lines (id, order_id, product_id, product_name, quantity, price_unit, price_subtotal, commission_earned)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            order_id = EXCLUDED.order_id,
            product_id = EXCLUDED.product_id,
            product_name = EXCLUDED.product_name,
            quantity = EXCLUDED.quantity,
            price_unit = EXCLUDED.price_unit,
            price_subtotal = EXCLUDED.price_subtotal,
            commission_earned = EXCLUDED.commission_earned
        `, [line.id, sale.id, line.product_id, line.product_name, line.quantity, line.price_unit, line.price_subtotal, line.commission_earned]);
      }
    }

    await client.query('COMMIT');
    console.log('Sincronización a Supabase realizada de manera exitosa.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al sincronizar datos hacia Supabase:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Download/Fetch all data from Supabase to keep local JSON in sync (Download)
export async function downloadDataFromSupabase(config: OdooConfig): Promise<{ productCommissions: ProductCommission[], salesOrders: CommissionSaleOrder[] }> {
  if (!config.supabase?.isEnabled || !config.supabase?.connectionString) {
    throw new Error('Supabase no está configurado o habilitado.');
  }

  const pool = getSupabasePool(config.supabase.connectionString);
  const client = await pool.connect();
  try {
    // 1. Fetch products
    const prodRes = await client.query('SELECT * FROM odoo_products ORDER BY name ASC');
    const products: ProductCommission[] = prodRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      default_code: row.default_code,
      list_price: Number(row.list_price),
      commission_type: row.commission_type as any,
      commission_value: Number(row.commission_value),
      company_id: row.company_id ? Number(row.company_id) : undefined,
      company_name: row.company_name ? String(row.company_name) : undefined
    }));

    // 2. Fetch sales
    const saleRes = await client.query('SELECT * FROM odoo_pos_sales ORDER BY date_order DESC');
    const salesOrders: CommissionSaleOrder[] = [];

    for (const saleRow of saleRes.rows) {
      const lineRes = await client.query('SELECT * FROM odoo_pos_lines WHERE order_id = $1', [saleRow.id]);
      const lines: CommissionSaleOrderLine[] = lineRes.rows.map(lineRow => ({
        id: lineRow.id,
        product_id: lineRow.product_id,
        product_name: lineRow.product_name,
        quantity: Number(lineRow.quantity),
        price_unit: Number(lineRow.price_unit),
        price_subtotal: Number(lineRow.price_subtotal),
        commission_earned: Number(lineRow.commission_earned)
      }));

      salesOrders.push({
        id: saleRow.id,
        name: saleRow.name,
        date_order: saleRow.date_order instanceof Date ? saleRow.date_order.toISOString() : new Date(saleRow.date_order).toISOString(),
        amount_total: Number(saleRow.amount_total),
        salesperson_id: saleRow.salesperson_id,
        salesperson_name: saleRow.salesperson_name,
        commission_total: Number(saleRow.commission_total),
        status: saleRow.status as any,
        lines,
        company_id: saleRow.company_id ? Number(saleRow.company_id) : undefined,
        company_name: saleRow.company_name ? String(saleRow.company_name) : undefined
      });
    }

    return { productCommissions: products, salesOrders };
  } catch (err) {
    console.error('Error al descargar datos de Supabase:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Save single product commission update to Supabase
export async function saveProductCommissionToSupabase(config: OdooConfig, product: ProductCommission, pendingOrdersToUpdate: CommissionSaleOrder[]): Promise<void> {
  if (!config.supabase?.isEnabled || !config.supabase?.connectionString) return;

  const pool = getSupabasePool(config.supabase.connectionString);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update product
    await client.query(`
      INSERT INTO odoo_products (id, name, default_code, list_price, commission_type, commission_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        commission_type = EXCLUDED.commission_type,
        commission_value = EXCLUDED.commission_value
    `, [product.id, product.name, product.default_code || '', product.list_price, product.commission_type, product.commission_value]);

    // Update affected orders and lines
    for (const order of pendingOrdersToUpdate) {
      await client.query(`
        UPDATE odoo_pos_sales 
        SET commission_total = $1
        WHERE id = $2
      `, [order.commission_total, order.id]);

      for (const line of order.lines) {
        await client.query(`
          UPDATE odoo_pos_lines 
          SET commission_earned = $1
          WHERE id = $2
        `, [line.commission_earned, line.id]);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al guardar comisión de producto en Supabase:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Update sales order status in Supabase
export async function saveSaleOrderStatusToSupabase(config: OdooConfig, saleId: number, status: 'paid' | 'pending'): Promise<void> {
  if (!config.supabase?.isEnabled || !config.supabase?.connectionString) return;

  const pool = getSupabasePool(config.supabase.connectionString);
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE odoo_pos_sales 
      SET status = $1
      WHERE id = $2
    `, [status, saleId]);
  } catch (err) {
    console.error('Error al actualizar estado de orden en Supabase:', err);
    throw err;
  } finally {
    client.release();
  }
}
