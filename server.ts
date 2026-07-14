import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  loadDb, 
  saveDb, 
  recalculatePendingCommissions, 
  testOdooConnection, 
  syncOdooProducts, 
  syncOdooSales,
  testSupabaseConnection,
  initSupabaseTables,
  uploadLocalDataToSupabase,
  downloadDataFromSupabase,
  saveProductCommissionToSupabase,
  saveSaleOrderStatusToSupabase,
  executeKw
} from './server_db';
import { OdooConfig, ProductCommission, CommissionSaleOrder, DashboardStats, SalespersonStats } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API ROUTE: Get active Odoo config (exclude password for security)
  app.get('/api/config', (req, res) => {
    try {
      const db = loadDb();
      // Clone config and omit password
      const configSafe = { ...db.config };
      if (configSafe.password) {
        configSafe.password = '••••••••';
      }
      res.json(configSafe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Save Odoo config
  app.post('/api/config', (req, res) => {
    try {
      const { url, db: odooDbName, username, password, isDemo } = req.body;
      const db = loadDb();

      // Check if password was edited or if it is the placeholder
      let finalPassword = password;
      if (password === '••••••••') {
        finalPassword = db.config.password; // Keep old password
      }

      db.config = {
        url: url || '',
        db: odooDbName || '',
        username: username || '',
        password: finalPassword || '',
        isDemo: !!isDemo,
        isConnected: isDemo ? true : db.config.isConnected, // if demo, always count as connected
        lastSyncedProducts: db.config.lastSyncedProducts,
        lastSyncedSales: db.config.lastSyncedSales,
        supabase: db.config.supabase, // Preserve Supabase config
      };

      // If we switched back to demo mode and sales list is empty, let's populate it
      if (db.config.isDemo && db.salesOrders.length === 0) {
        // Recalculate will also handle syncing
        res.status(200); // trigger regenerate below
      }

      saveDb(db);
      res.json({ success: true, message: 'Configuración guardada correctamente.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Get user profiles and companies lists
  app.get('/api/profiles', (req, res) => {
    try {
      const db = loadDb();
      res.json({
        userProfiles: db.config.userProfiles || [],
        companies: db.config.companies || [],
        activeProfileId: db.config.activeProfileId || 'admin-global'
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Add or update a user profile
  app.post('/api/profiles', (req, res) => {
    try {
      const { id, name, email, role, companyId, companyName } = req.body;
      const db = loadDb();
      if (!db.config.userProfiles) db.config.userProfiles = [];

      const existingIdx = db.config.userProfiles.findIndex(p => p.id === id);
      const newProfile = { id, name, email, role, companyId, companyName };

      if (existingIdx >= 0) {
        db.config.userProfiles[existingIdx] = newProfile;
      } else {
        db.config.userProfiles.push(newProfile);
      }

      saveDb(db);

      // Trigger sync if Supabase is enabled
      if (db.config.supabase?.isEnabled && db.config.supabase?.connectionString) {
        uploadLocalDataToSupabase(db).catch(err => {
          console.error('Error al subir perfiles a Supabase en background:', err);
        });
      }

      res.json({ success: true, profile: newProfile });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Delete user profile
  app.delete('/api/profiles/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDb();
      if (db.config.userProfiles) {
        db.config.userProfiles = db.config.userProfiles.filter(p => p.id !== id);
      }
      if (db.config.activeProfileId === id) {
        db.config.activeProfileId = 'admin-global';
      }
      saveDb(db);

      // Trigger sync if Supabase is enabled
      if (db.config.supabase?.isEnabled && db.config.supabase?.connectionString) {
        uploadLocalDataToSupabase(db).catch(err => {
          console.error('Error al subir perfiles a Supabase tras eliminación:', err);
        });
      }

      res.json({ success: true, message: 'Perfil eliminado correctamente.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Set active profile
  app.post('/api/profiles/active', (req, res) => {
    try {
      const { activeProfileId } = req.body;
      const db = loadDb();
      db.config.activeProfileId = activeProfileId;
      saveDb(db);
      res.json({ success: true, activeProfileId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Test Odoo connection
  app.post('/api/config/test', async (req, res) => {
    try {
      const { url, db: odooDbName, username, password } = req.body;
      
      const configToTest: OdooConfig = {
        url,
        db: odooDbName,
        username,
        password,
        isDemo: false,
        isConnected: false
      };

      const uid = await testOdooConnection(configToTest);
      
      // Connection succeeded! Update connection status in database
      const db = loadDb();
      db.config.isConnected = true;
      db.config.password = password; // Save working password
      db.config.url = url;
      db.config.db = odooDbName;
      db.config.username = username;
      db.config.isDemo = false;
      saveDb(db);

      res.json({ success: true, message: `Conexión exitosa. UID de Odoo obtenido: ${uid}` });
    } catch (e: any) {
      // Don't mark as disconnected if they were just playing, but update
      const db = loadDb();
      db.config.isConnected = false;
      saveDb(db);
      res.status(400).json({ error: e.message || 'Falló la autenticación con Odoo' });
    }
  });

  // API ROUTE: Sync products
  app.post('/api/config/sync-products', async (req, res) => {
    try {
      const db = loadDb();
      if (db.config.isDemo) {
        // In demo mode, syncing is a mock operation
        db.config.lastSyncedProducts = new Date().toISOString();
        saveDb(db);
        return res.json({ success: true, message: 'Productos sincronizados en Modo Demo (8 productos cargados).' });
      }

      // Check real connection
      if (!db.config.isConnected) {
        return res.status(400).json({ error: 'Debe probar y validar la conexión con Odoo antes de sincronizar.' });
      }

      // Authenticate again to get UID
      const uid = await testOdooConnection(db.config);
      const updatedProducts = await syncOdooProducts(db.config, uid);

      res.json({ 
        success: true, 
        message: `Sincronización exitosa. Se importaron ${updatedProducts.length} productos de Odoo.`,
        count: updatedProducts.length 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Sync sales orders
  app.post('/api/config/sync-sales', async (req, res) => {
    try {
      const db = loadDb();
      if (db.config.isDemo) {
        db.config.lastSyncedSales = new Date().toISOString();
        saveDb(db);
        return res.json({ success: true, message: 'Ventas sincronizadas en Modo Demo (15 órdenes cargadas).' });
      }

      // Check real connection
      if (!db.config.isConnected) {
        return res.status(400).json({ error: 'Debe probar y validar la conexión con Odoo antes de sincronizar.' });
      }

      const uid = await testOdooConnection(db.config);
      const updatedSales = await syncOdooSales(db.config, uid);

      res.json({ 
        success: true, 
        message: `Sincronización exitosa. Se importaron ${updatedSales.length} órdenes confirmadas de Odoo.`,
        count: updatedSales.length 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Generic Odoo RPC Proxy to allow the browser to safely execute any Odoo query
  app.post('/api/odoo/rpc-proxy', async (req, res) => {
    try {
      const { model, method, args = [], kwargs = {}, uid: providedUid, configOverride } = req.body;
      const db = loadDb();
      const configToUse = configOverride ? { ...db.config, ...configOverride } : db.config;

      if (configToUse.isDemo) {
        // Mock response for Demo Mode to avoid connection failures
        console.log(`[RPC Proxy - Demo Mode] Simulated call: ${model}.${method}`, { args, kwargs });
        
        // Return structured fake data depending on the model/method
        if (model === 'res.company') {
          return res.json([
            { id: 1, name: "Botica Principal S.A.C." },
            { id: 2, name: "Sucursal Sur Droguería" }
          ]);
        }
        if (model === 'product.template' || model === 'product.product') {
          return res.json(db.productCommissions);
        }
        if (model === 'pos.order') {
          return res.json(db.salesOrders);
        }
        return res.json({ success: true, isDemo: true, message: `Simulación de Odoo exitosa para ${model}.${method}` });
      }

      // Ensure we have a valid Odoo configuration
      if (!configToUse.url || !configToUse.db || !configToUse.username) {
        return res.status(400).json({ error: 'La configuración de Odoo no está completa o no es válida.' });
      }

      // Get or verify user ID (uid)
      let uid = Number(providedUid);
      if (!uid) {
        try {
          uid = await testOdooConnection(configToUse);
        } catch (authErr: any) {
          return res.status(401).json({ error: `Fallo de autenticación con Odoo: ${authErr.message}` });
        }
      }

      if (method === 'authenticate') {
        return res.json({ success: true, uid });
      }

      if (!model) {
        return res.status(400).json({ error: 'El parámetro "model" es obligatorio para ejecutar métodos de Odoo.' });
      }

      // Execute external call
      const result = await executeKw(configToUse, uid, model, method, args, kwargs);
      res.json(result);
    } catch (e: any) {
      console.error('Error in Odoo RPC Proxy:', e);
      res.status(500).json({ error: e.message || 'Error interno en el proxy de Odoo RPC' });
    }
  });

  // === Supabase Integration API Routes ===

  // API ROUTE: Save Supabase config
  app.post('/api/config/supabase', (req, res) => {
    try {
      const { connectionString, isEnabled } = req.body;
      const db = loadDb();

      db.config.supabase = {
        connectionString: connectionString || '',
        isEnabled: !!isEnabled,
        isConnected: db.config.supabase ? db.config.supabase.isConnected : false,
        lastSynced: db.config.supabase ? db.config.supabase.lastSynced : undefined
      };

      saveDb(db);
      res.json({ success: true, message: 'Configuración de Supabase guardada correctamente.', config: db.config.supabase });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Test Supabase connection
  app.post('/api/config/supabase/test', async (req, res) => {
    try {
      const { connectionString } = req.body;
      if (!connectionString) {
        return res.status(400).json({ error: 'La cadena de conexión es obligatoria.' });
      }

      await testSupabaseConnection(connectionString);
      
      const db = loadDb();
      if (!db.config.supabase) {
        db.config.supabase = { connectionString, isEnabled: false, isConnected: true };
      } else {
        db.config.supabase.connectionString = connectionString;
        db.config.supabase.isConnected = true;
      }
      saveDb(db);

      res.json({ success: true, message: '¡Conexión con Supabase establecida con éxito!' });
    } catch (e: any) {
      const db = loadDb();
      if (db.config.supabase) {
        db.config.supabase.isConnected = false;
        saveDb(db);
      }
      res.status(400).json({ error: e.message || 'Falló la conexión con Supabase. Verifique los parámetros.' });
    }
  });

  // API ROUTE: Initialize Supabase tables and upload data
  app.post('/api/config/supabase/init', async (req, res) => {
    try {
      const db = loadDb();
      if (!db.config.supabase?.connectionString) {
        return res.status(400).json({ error: 'Supabase no está configurado.' });
      }

      // 1. Create tables if they don't exist
      await initSupabaseTables(db.config.supabase.connectionString);

      // 2. Mark as connected & enabled
      db.config.supabase.isConnected = true;
      db.config.supabase.isEnabled = true;
      db.config.supabase.lastSynced = new Date().toISOString();
      saveDb(db);

      // 3. Upload all local data (UPSERT)
      await uploadLocalDataToSupabase(db);

      res.json({ 
        success: true, 
        message: 'Tablas creadas y datos sincronizados correctamente en Supabase.',
        config: db.config.supabase
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Sync down from Supabase
  app.post('/api/config/supabase/sync-down', async (req, res) => {
    try {
      const db = loadDb();
      if (!db.config.supabase?.connectionString || !db.config.supabase?.isEnabled) {
        return res.status(400).json({ error: 'Supabase no está habilitado o configurado.' });
      }

      const { productCommissions, salesOrders } = await downloadDataFromSupabase(db.config);
      
      db.productCommissions = productCommissions;
      db.salesOrders = salesOrders;
      db.config.supabase.lastSynced = new Date().toISOString();
      saveDb(db);

      res.json({ 
        success: true, 
        message: `Sincronización descendente completada. Se descargaron ${productCommissions.length} productos y ${salesOrders.length} órdenes de venta desde Supabase.`,
        productsCount: productCommissions.length,
        salesCount: salesOrders.length
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Get products
  app.get('/api/products', (req, res) => {
    try {
      const db = loadDb();
      res.json(db.productCommissions);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Update product commission configuration
  app.put('/api/products/:id/commission', (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { commission_type, commission_value } = req.body;

      if (!['fixed', 'percentage', 'none'].includes(commission_type)) {
        return res.status(400).json({ error: 'Tipo de comisión inválido.' });
      }

      const db = loadDb();
      const productIdx = db.productCommissions.findIndex(p => p.id === productId);

      if (productIdx === -1) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      // Update product commission rules
      db.productCommissions[productIdx].commission_type = commission_type;
      db.productCommissions[productIdx].commission_value = Number(commission_value) || 0;

      // Automatically recalculate pending commissions for all existing orders
      recalculatePendingCommissions(db);
      
      saveDb(db);

      // If Supabase integration is active, update product & orders in Supabase
      if (db.config.supabase?.isEnabled && db.config.supabase?.connectionString) {
        const productRule = db.productCommissions[productIdx];
        const pendingOrdersToUpdate = db.salesOrders.filter(o => o.status === 'pending');
        saveProductCommissionToSupabase(db.config, productRule, pendingOrdersToUpdate).catch(err => {
          console.error('Error al guardar comisión de producto en Supabase:', err);
        });
      }

      res.json({ 
        success: true, 
        product: db.productCommissions[productIdx],
        message: 'Comisión del producto actualizada y comisiones pendientes recalculadas correctamente.' 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Get sales orders
  app.get('/api/sales', (req, res) => {
    try {
      const db = loadDb();
      res.json(db.salesOrders);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Mark sales order commission as paid
  app.post('/api/sales/:id/pay', (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const db = loadDb();
      const orderIdx = db.salesOrders.findIndex(o => o.id === orderId);

      if (orderIdx === -1) {
        return res.status(404).json({ error: 'Orden de venta no encontrada.' });
      }

      db.salesOrders[orderIdx].status = 'paid';
      saveDb(db);

      // If Supabase integration is active, update order status in Supabase
      if (db.config.supabase?.isEnabled && db.config.supabase?.connectionString) {
        saveSaleOrderStatusToSupabase(db.config, orderId, 'paid').catch(err => {
          console.error('Error al actualizar estado de orden en Supabase:', err);
        });
      }

      res.json({ success: true, order: db.salesOrders[orderIdx], message: 'Comisión de venta marcada como Pagada.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Get list of unique sellers/salespersons
  app.get('/api/sellers', (req, res) => {
    try {
      const db = loadDb();
      const sellersMap = new Map<number, string>();
      
      db.salesOrders.forEach(o => {
        if (o.salesperson_id && o.salesperson_name) {
          sellersMap.set(o.salesperson_id, o.salesperson_name);
        }
      });

      const sellers = Array.from(sellersMap.entries()).map(([id, name]) => ({
        id,
        name
      }));

      res.json(sellers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API ROUTE: Get dashboard stats
  app.get('/api/reporting/stats', (req, res) => {
    try {
      const db = loadDb();
      const activeProfileId = db.config.activeProfileId || 'admin-global';
      const activeProfile = (db.config.userProfiles || []).find(p => p.id === activeProfileId) || { role: 'admin' };

      let orders = db.salesOrders;
      let products = db.productCommissions;

      // Filter by company if user is not global admin
      if (activeProfile.role !== 'admin' && activeProfile.companyId) {
        orders = orders.filter(o => o.company_id === activeProfile.companyId);
        products = products.filter(p => p.company_id === activeProfile.companyId);
      }

      let totalSales = 0;
      let totalCommission = 0;
      let pendingCommission = 0;
      let paidCommission = 0;

      const salespersonCommissions = new Map<string, number>();

      orders.forEach(o => {
        totalSales += o.amount_total;
        totalCommission += o.commission_total;
        
        if (o.status === 'paid') {
          paidCommission += o.commission_total;
        } else {
          pendingCommission += o.commission_total;
        }

        const name = o.salesperson_name || 'Vendedor General';
        const currentVal = salespersonCommissions.get(name) || 0;
        salespersonCommissions.set(name, currentVal + o.amount_total);
      });

      const commissionedProductsCount = products.filter(p => p.commission_type !== 'none').length;

      // Find top salesperson by sales amount
      let topSalesperson: { name: string; amount: number } | null = null;
      let maxSales = -1;
      salespersonCommissions.forEach((sales, name) => {
        if (sales > maxSales) {
          maxSales = sales;
          topSalesperson = { name, amount: Math.round(sales * 100) / 100 };
        }
      });

      const stats: DashboardStats = {
        total_sales: Math.round(totalSales * 100) / 100,
        total_commission: Math.round(totalCommission * 100) / 100,
        pending_commission: Math.round(pendingCommission * 100) / 100,
        paid_commission: Math.round(paidCommission * 100) / 100,
        commissioned_products_count: commissionedProductsCount,
        total_orders_count: orders.length,
        top_salesperson: topSalesperson
      };

      // Include detail stats for charts
      const statsBySeller: SalespersonStats[] = [];
      const sellerIdsMap = new Map<number, string>();
      orders.forEach(o => sellerIdsMap.set(o.salesperson_id, o.salesperson_name));

      sellerIdsMap.forEach((name, id) => {
        const sellerOrders = orders.filter(o => o.salesperson_id === id);
        const sellerSales = sellerOrders.reduce((sum, o) => sum + o.amount_total, 0);
        const sellerComm = sellerOrders.reduce((sum, o) => sum + o.commission_total, 0);
        const sellerPaid = sellerOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.commission_total, 0);
        const sellerPending = sellerOrders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.commission_total, 0);

        statsBySeller.push({
          id,
          name,
          total_sales: Math.round(sellerSales * 100) / 100,
          total_commission: Math.round(sellerComm * 100) / 100,
          pending_commission: Math.round(sellerPending * 100) / 100,
          paid_commission: Math.round(sellerPaid * 100) / 100,
          order_count: sellerOrders.length
        });
      });

      res.json({
        summary: stats,
        bySeller: statsBySeller
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Integrate Vite dev middleware OR static site files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Commission Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start full-stack server:', err);
});
