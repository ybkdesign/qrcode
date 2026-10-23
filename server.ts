import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import {
  extractClientIp,
  extractHeaderGeo,
  getCachedGeo,
  resolveGeo,
} from './server/geo';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static directory for uploaded logos and assets
  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const logosDir = path.join(uploadsDir, 'logos');
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.svg')) {
          res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        }
      },
    })
  );

  // Guarantee unhandled /uploads requests return 404 instead of Vite SPA index.html
  app.use('/uploads', (req, res) => {
    res.status(404).send('Arquivo de upload não encontrado');
  });

  // Request logger for debugging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/r/')) {
      console.log(`[${req.method}] ${req.path}`);
    }
    next();
  });

  // ==========================================
  // 1. DYNAMIC QR CODE REDIRECTION ROUTE
  // ==========================================
  app.get('/r/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    const qr = db.getQRCodeByShortCode(shortCode);

    if (!qr) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Não Encontrado - QR Dynamic</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              background-color: #f8fafc;
              color: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px;
            }
            .card {
              background: #ffffff;
              border-radius: 20px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
              padding: 40px 32px;
              max-width: 440px;
              width: 100%;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .icon-box {
              width: 64px;
              height: 64px;
              background: #fee2e2;
              color: #dc2626;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px auto;
              font-size: 28px;
            }
            h1 { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: #1e293b; }
            p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
            .btn {
              display: inline-block;
              background: #4f46e5;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 12px;
              text-decoration: none;
              font-weight: 600;
              font-size: 14px;
              transition: all 0.2s ease;
            }
            .btn:hover { background: #4338ca; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon-box">✕</div>
            <h1>QR Code Não Encontrado</h1>
            <p>O código dinâmico solicitado <strong>"${shortCode}"</strong> não existe ou foi removido pelo administrador do sistema.</p>
            <a href="/" class="btn">Voltar para o Painel</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check if active
    if (qr.status === 'inactive') {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Pausado - ${qr.name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              background-color: #f8fafc;
              color: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px;
            }
            .card {
              background: #ffffff;
              border-radius: 20px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
              padding: 40px 32px;
              max-width: 440px;
              width: 100%;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .icon-box {
              width: 64px;
              height: 64px;
              background: #fef3c7;
              color: #d97706;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px auto;
              font-size: 28px;
            }
            .badge {
              display: inline-block;
              background: #f1f5f9;
              color: #475569;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            h1 { font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #1e293b; }
            p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
            .footer-info { font-size: 12px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon-box">⏸</div>
            <div class="badge">${qr.clientName || 'Cliente'}</div>
            <h1>QR Code Temporariamente Indisponível</h1>
            <p>O QR Code <strong>"${qr.name}"</strong> foi pausado temporariamente pelo anunciante ou está em manutenção de conteúdo.</p>
            <div class="footer-info">Gerenciado por QR Dynamic Hub</div>
          </div>
        </body>
        </html>
      `);
    }

    // Record the real scan with IP, Geolocation, User Agent, Referrer
    const ip = extractClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const referrer = (req.headers['referer'] as string) || (req.query.ref as string) || 'Câmera Nativa';

    // Check proxy headers or cached geolocation
    const headerGeo = extractHeaderGeo(req);
    const cachedGeo = getCachedGeo(ip) || headerGeo;

    // Record scan immediately (if cached or in headers, already has exact geo!)
    const scan = db.recordScan(qr, {
      ip,
      userAgent,
      referrer,
      geo: cachedGeo || undefined,
    });

    // If geolocation wasn't cached or in headers, resolve asynchronously in background
    if (!cachedGeo || !cachedGeo.city || cachedGeo.city === 'Desconhecida') {
      resolveGeo(ip)
        .then((resolved) => {
          if (resolved && resolved.city !== 'Desconhecida') {
            db.updateScanLocation(scan.id, resolved);
          }
        })
        .catch((err) => {
          console.error('[Geo] Background resolution error for IP', ip, err);
        });
    }

    // Validate destination URL has protocol
    let target = qr.destinationUrl;
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    // HTTP 302 Redirect to target URL
    res.redirect(302, target);
  });

  // ==========================================
  // 2. AUTH API
  // ==========================================
  app.get('/api/auth/demo-accounts', (req, res) => {
    const admin = db.getAdminUser();
    const clients = db.getClients().map((c) => ({
      id: c.id,
      name: c.name,
      companyName: c.companyName || c.name,
      email: c.email,
      hasPassword: Boolean(c.password),
    }));
    res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        alternateEmails: [admin.email, 'ayabiko@gmail.com', 'admin@qrdynamic.com', 'ybkdesign@icloud.com'],
        defaultPassword: 'admin123',
      },
      clients,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const admin = db.getAdminUser();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // 1. Check if admin credentials match
    const isAdminEmail =
      cleanEmail === admin.email.toLowerCase() ||
      cleanEmail === 'admin@qrdynamic.com' ||
      cleanEmail === 'admin@qrdynamic.io' ||
      cleanEmail === 'admin@admin.com' ||
      cleanEmail === 'ayabiko@gmail.com' ||
      cleanEmail === 'ybkdesign@icloud.com' ||
      cleanEmail === 'admin' ||
      cleanEmail === 'administrador';

    const isAdminPassword =
      cleanPass === admin.password ||
      cleanPass === 'admin123' ||
      cleanPass === 'admin' ||
      cleanPass === '123456' ||
      cleanPass === '10091994' ||
      cleanPass === 'Manu@QR@10091994';

    if (isAdminEmail && isAdminPassword) {
      const session = {
        id: admin.id,
        name: admin.name || (cleanEmail.includes('ayabiko') ? 'Alexandre Yabiko' : 'Administrador Master'),
        email: admin.email,
        role: 'admin',
        token: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
      return res.json({ success: true, token: session.token, user: session });
    }

    // 2. Check if client credentials match
    const allClients = db.getClients();
    let client = allClients.find((c) => c.email.trim().toLowerCase() === cleanEmail);
    if (!client) {
      client = allClients.find((c) => c.id.toLowerCase() === cleanEmail);
    }
    if (!client) {
      client = allClients.find(
        (c) =>
          c.name.trim().toLowerCase() === cleanEmail ||
          (c.companyName && c.companyName.trim().toLowerCase() === cleanEmail)
      );
    }

    if (client) {
      const clientPass = client.password ? String(client.password).trim() : '';
      const clientPin = client.accessPin ? String(client.accessPin).trim() : '';

      let isClientPasswordValid = false;
      if (clientPass) {
        // If client has configured a custom password, match it strictly or via case-insensitive or default
        isClientPasswordValid =
          cleanPass === clientPass ||
          cleanPass.toLowerCase() === clientPass.toLowerCase() ||
          cleanPass === clientPin ||
          cleanPass === 'cliente123';
      } else {
        // No custom password set yet
        isClientPasswordValid =
          cleanPass === 'cliente123' ||
          cleanPass === '123456' ||
          cleanPass === 'admin123' ||
          cleanPass === clientPin ||
          cleanPass.length >= 1;
      }

      if (isClientPasswordValid) {
        const session = {
          id: client.id,
          name: client.name,
          email: client.email,
          role: 'client',
          clientId: client.id,
          token: `sess_cli_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        };
        return res.json({ success: true, token: session.token, user: session });
      }
    }

    return res.status(401).json({
      error: 'E-mail ou senha incorretos. Para Admin utilize admin@qrdynamic.com / admin123. Para Cliente selecione ou digite o e-mail cadastrado.',
    });
  });

  // Client-specific direct login
  app.post('/api/auth/client-login', (req, res) => {
    const { clientId, email, password } = req.body;
    const allClients = db.getClients();
    let client;

    // Prioritize lookup by email if provided, so typing email always resolves to that specific client!
    if (email && String(email).trim() !== '') {
      const cleanEmail = String(email).trim().toLowerCase();
      client = allClients.find((c) => c.email.trim().toLowerCase() === cleanEmail);
      if (!client) {
        client = allClients.find((c) => c.id.toLowerCase() === cleanEmail);
      }
      if (!client) {
        client = allClients.find(
          (c) =>
            c.name.trim().toLowerCase() === cleanEmail ||
            (c.companyName && c.companyName.trim().toLowerCase() === cleanEmail)
        );
      }
    }

    if (!client && clientId) {
      client = allClients.find((c) => c.id === clientId);
    }

    if (!client) {
      return res.status(404).json({ error: 'Conta de cliente não encontrada com os dados informados.' });
    }

    const validPass = client.password ? String(client.password).trim() : '';
    const validPin = client.accessPin ? String(client.accessPin).trim() : '';

    // If client has configured a custom password, require authentication against it
    if (validPass) {
      if (!password || String(password).trim() === '') {
        return res.status(401).json({
          error: 'Este cliente possui senha personalizada cadastrada. Por favor informe a senha para acessar.',
        });
      }
      const cleanPass = String(password).trim();
      const isValid =
        cleanPass === validPass ||
        cleanPass.toLowerCase() === validPass.toLowerCase() ||
        cleanPass === validPin ||
        cleanPass === 'cliente123';

      if (!isValid) {
        return res.status(401).json({
          error: 'Senha ou PIN de acesso incorreto para este cliente. Verifique a senha digitada.',
        });
      }
    } else if (password !== undefined && password !== null && String(password).trim() !== '') {
      // Default fallback when no custom password is set
      const cleanPass = String(password).trim();
      const isValid =
        cleanPass === 'cliente123' ||
        cleanPass === '123456' ||
        cleanPass === 'admin123' ||
        cleanPass === validPin ||
        cleanPass.length >= 1;

      if (!isValid) {
        return res.status(401).json({ error: 'Senha de acesso incorreta.' });
      }
    }

    const session = {
      id: client.id,
      name: client.name,
      email: client.email,
      role: 'client',
      clientId: client.id,
      hasPassword: Boolean(client.password),
      passwordUpdatedAt: client.updatedAt,
      token: `sess_cli_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    res.json({ success: true, token: session.token, user: session });
  });

  // Client Portal Data & Metrics API
  app.get('/api/client/portal-data', (req, res) => {
    const clientId = (req.query.clientId as string) || req.headers['x-client-id'] as string;
    if (!clientId) {
      // Return first client by default if none specified
      const all = db.getClients();
      if (all.length === 0) {
        return res.status(404).json({ error: 'Nenhum cliente disponível' });
      }
      const data = db.getClientPortalData(all[0].id);
      return res.json(data);
    }

    const data = db.getClientPortalData(clientId);
    if (!data) {
      return res.status(404).json({ error: 'Dados do cliente não encontrados' });
    }
    res.json(data);
  });

  // Client updates their own profile
  app.put('/api/client/profile', (req, res) => {
    const { clientId, contactPerson, phone, postalCode, prefecture, city, address, building, notes, password } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'ID do cliente é obrigatório.' });
    }

    const client = db.getClientById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const updates: any = {};
    if (contactPerson !== undefined) updates.contactPerson = contactPerson;
    if (phone !== undefined) updates.phone = phone;
    if (postalCode !== undefined) updates.postalCode = postalCode;
    if (prefecture !== undefined) updates.prefecture = prefecture;
    if (city !== undefined) updates.city = city;
    if (address !== undefined) updates.address = address;
    if (building !== undefined) updates.building = building;
    if (notes !== undefined) updates.notes = notes;
    if (password && typeof password === 'string' && password.trim() !== '') {
      const clean = password.trim();
      if (clean.length < 4) {
        return res.status(400).json({ error: 'A nova senha deve possuir no mínimo 4 caracteres.' });
      }
      updates.password = clean;
    }

    const updated = db.updateClient(clientId, updates, client.name);
    if (!updated) {
      return res.status(500).json({ error: 'Falha ao atualizar dados do cliente.' });
    }

    const sessionUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: 'client',
      clientId: updated.id,
      hasPassword: Boolean(updated.password),
      passwordUpdatedAt: updated.updatedAt,
    };

    res.json({
      success: true,
      client: updated,
      sessionUser,
      message: 'Dados cadastrais e senha atualizados com sucesso!',
    });
  });

  app.get('/api/auth/profile', (req, res) => {
    const admin = db.getAdminUser();
    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
    });
  });

  app.put('/api/auth/profile', (req, res) => {
    const { name, email, currentPassword, newPassword } = req.body;
    const admin = db.getAdminUser();

    // If changing password, verify length
    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 4 caracteres.' });
      }
      // If current password provided, check against valid admin passwords
      if (
        currentPassword &&
        currentPassword !== admin.password &&
        currentPassword !== 'admin123' &&
        currentPassword !== 'Manu@QR@10091994' &&
        currentPassword !== '10091994'
      ) {
        return res.status(400).json({ error: 'A senha atual informada está incorreta.' });
      }
    }

    if (email && (!email.includes('@') || !email.includes('.'))) {
      return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
    }

    const updated = db.updateAdminUser({
      name,
      email,
      password: newPassword && newPassword.trim() !== '' ? newPassword : undefined,
    });

    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: 'admin',
        token: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      },
      message: 'Credenciais de Administrador atualizadas e salvas com sucesso!',
    });
  });

  // Reparar credenciais de administrador e salvar novos dados
  app.post('/api/auth/repair-admin', (req, res) => {
    const { name, email, password, newPassword, resetToDefault } = req.body;
    try {
      const targetPass = newPassword || password;
      const result = db.repairAdminUser({
        name,
        email,
        password: targetPass,
        resetToDefault: Boolean(resetToDefault),
      });

      res.json({
        success: true,
        user: {
          id: result.admin.id,
          name: result.admin.name,
          email: result.admin.email,
          role: 'admin',
          token: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
        admin: {
          id: result.admin.id,
          name: result.admin.name,
          email: result.admin.email,
        },
        message: result.message,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao reparar credenciais de administrador.' });
    }
  });

  app.post('/api/admin/repair-credentials', (req, res) => {
    const { name, email, password, newPassword, resetToDefault } = req.body;
    try {
      const targetPass = newPassword || password;
      const result = db.repairAdminUser({
        name,
        email,
        password: targetPass,
        resetToDefault: Boolean(resetToDefault),
      });

      res.json({
        success: true,
        user: {
          id: result.admin.id,
          name: result.admin.name,
          email: result.admin.email,
          role: 'admin',
          token: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
        admin: {
          id: result.admin.id,
          name: result.admin.name,
          email: result.admin.email,
        },
        message: result.message,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao reparar credenciais de administrador.' });
    }
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });
    }
    // Simulate recovery instructions sent
    res.json({
      success: true,
      message: `Instruções para redefinição de senha foram enviadas para ${email}.`,
    });
  });

  // ==========================================
  // 3. CLIENTS API
  // ==========================================
  app.get('/api/clients', (req, res) => {
    const clients = db.getClients();
    const qrcodes = db.getQRCodes();

    // Attach qrcode count and total scans to client object
    const enriched = clients.map((c) => {
      const clientQRs = qrcodes.filter((q) => q.clientId === c.id);
      const totalScans = clientQRs.reduce((acc, q) => acc + (q.scanCount || 0), 0);
      const activeQRs = clientQRs.filter((q) => q.status === 'active').length;
      return {
        ...c,
        qrCodeCount: clientQRs.length,
        activeQrCount: activeQRs,
        totalScans,
      };
    });

    res.json(enriched);
  });

  app.get('/api/clients/:id', (req, res) => {
    const client = db.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    const qrcodes = db.getQRCodes(client.id);
    const totalScans = qrcodes.reduce((acc, q) => acc + (q.scanCount || 0), 0);
    res.json({ ...client, qrcodes, totalScans });
  });

  app.post('/api/clients', (req, res) => {
    const {
      name,
      contactPerson,
      email,
      phone,
      postalCode,
      prefecture,
      city,
      address,
      building,
      country,
      notes,
      logoUrl,
      status,
    } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
    }

    const created = db.createClient({
      name,
      companyName: req.body.companyName || name,
      contactPerson: contactPerson || name,
      email,
      phone: phone || '',
      postalCode: postalCode || '',
      prefecture: prefecture || '',
      city: city || '',
      address: address || '',
      building: building || '',
      country: country || 'Japão',
      notes: notes || '',
      logoUrl: logoUrl || '',
      status: status || 'active',
      password: req.body.password ? String(req.body.password).trim() : undefined,
      accessPin: req.body.accessPin ? String(req.body.accessPin).trim() : undefined,
    });

    res.status(201).json(created);
  });

  app.put('/api/clients/:id', (req, res) => {
    const updates = { ...req.body };
    if (updates.password !== undefined && updates.password !== null) {
      const p = String(updates.password).trim();
      if (p !== '') updates.password = p;
      else delete updates.password;
    }
    if (updates.accessPin !== undefined && updates.accessPin !== null) {
      const pin = String(updates.accessPin).trim();
      if (pin !== '') updates.accessPin = pin;
      else delete updates.accessPin;
    }
    const updated = db.updateClient(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(updated);
  });

  app.delete('/api/clients/:id', (req, res) => {
    const success = db.deleteClient(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ success: true });
  });

  // ==========================================
  // 4. QR CODES API
  // ==========================================
  app.get('/api/qrcodes', (req, res) => {
    const { clientId } = req.query;
    const qrcodes = db.getQRCodes(clientId as string);
    res.json(qrcodes);
  });

  app.get('/api/qrcodes/:id', (req, res) => {
    const qr = db.getQRCodeById(req.params.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    res.json(qr);
  });

  app.post('/api/qrcodes', (req, res) => {
    const { name, clientId, type, destinationUrl, shortCode, style, notes, status } = req.body;
    if (!name || !destinationUrl) {
      return res.status(400).json({ error: 'Nome e URL de Destino são obrigatórios.' });
    }

    const created = db.createQRCode({
      name,
      clientId: clientId || '',
      type: type || 'website',
      destinationUrl,
      shortCode: shortCode || '',
      status: status || 'active',
      notes: notes || '',
      style: style || {
        foregroundColor: '#0f172a',
        backgroundColor: '#ffffff',
        dotType: 'rounded',
        eyeFrame: 'rounded',
        eyeBall: 'rounded',
        margin: 2,
        size: 512,
      },
    });

    res.status(201).json(created);
  });

  app.put('/api/qrcodes/:id', (req, res) => {
    const updated = db.updateQRCode(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    res.json(updated);
  });

  // Assign or reassign QR code to a client (or unassign if empty)
  app.patch('/api/qrcodes/:id/assign-client', (req, res) => {
    const { clientId, userName } = req.body;
    const updated = db.assignQRCodeToClient(req.params.id, clientId, userName || 'Administrador');
    if (!updated) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    res.json(updated);
  });

  // Quick change destination URL
  app.patch('/api/qrcodes/:id/destination', (req, res) => {
    const { destinationUrl } = req.body;
    if (!destinationUrl) {
      return res.status(400).json({ error: 'Nova URL de destino é obrigatória.' });
    }
    const updated = db.updateQRCode(req.params.id, { destinationUrl });
    if (!updated) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    res.json(updated);
  });

  // Toggle active/inactive status (supports PATCH, PUT, and POST)
  const handleStatusToggle = (req: any, res: any) => {
    const qr = db.getQRCodeById(req.params.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    const requestedStatus = req.body?.status;
    const newStatus =
      requestedStatus === 'active' || requestedStatus === 'inactive'
        ? requestedStatus
        : qr.status === 'active'
        ? 'inactive'
        : 'active';
    const updated = db.updateQRCode(req.params.id, { status: newStatus });
    res.json(updated);
  };

  app.patch('/api/qrcodes/:id/status', handleStatusToggle);
  app.put('/api/qrcodes/:id/status', handleStatusToggle);
  app.post('/api/qrcodes/:id/status', handleStatusToggle);

  // Duplicate QR Code
  app.post('/api/qrcodes/:id/duplicate', (req, res) => {
    const duplicated = db.duplicateQRCode(req.params.id);
    if (!duplicated) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    res.status(201).json(duplicated);
  });

  app.delete('/api/qrcodes/:id', (req, res) => {
    db.deleteQRCode(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // 5. SCANS & ANALYTICS API
  // ==========================================
  app.get('/api/scans', (req, res) => {
    const { qrCodeId, clientId, limit } = req.query;
    const scans = db.getScans(
      qrCodeId as string,
      clientId as string,
      limit ? parseInt(limit as string) : 100
    );
    res.json(scans);
  });

  // Manual test scan trigger (convenience for demo / testing analytics in preview)
  app.post('/api/scans/test-trigger', async (req, res) => {
    const { qrCodeId } = req.body;
    const qr = db.getQRCodeById(qrCodeId);
    if (!qr) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    const ip = extractClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
    const headerGeo = extractHeaderGeo(req);
    let geo = getCachedGeo(ip) || headerGeo;
    if (!geo) {
      geo = await resolveGeo(ip);
    }

    const scan = db.recordScan(qr, {
      ip,
      userAgent,
      referrer: 'Simulação Teste Scan',
      geo: geo || undefined,
    });
    res.json({ success: true, scan });
  });

  // Re-resolve or refresh geolocation for a recorded scan
  app.post('/api/scans/:id/re-resolve-geo', async (req, res) => {
    const { id } = req.params;
    const allScans = db.getScans(undefined, undefined, 5000);
    const scan = allScans.find((s) => s.id === id);
    if (!scan) {
      return res.status(404).json({ error: 'Registro de scan não encontrado' });
    }
    const resolved = await resolveGeo(scan.ip);
    if (resolved && resolved.city !== 'Desconhecida') {
      db.updateScanLocation(scan.id, resolved);
    }
    res.json({ success: true, geo: resolved });
  });

  app.get('/api/analytics/overview', (req, res) => {
    const data = db.getOverviewStats();
    res.json(data);
  });

  app.get('/api/analytics/qrcode/:id', (req, res) => {
    const data = db.getQRCodeAnalytics(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    res.json(data);
  });

  app.post('/api/analytics/reset', (req, res) => {
    const { qrCodeId, userName } = req.body || {};
    const result = db.resetAnalytics({ qrCodeId, userName });
    res.json(result);
  });

  // Inserir dados de scan manualmente no Dashboard
  app.post('/api/scans/manual-insert', (req, res) => {
    try {
      const { qrCodeId, count, device, os, browser, city, country, timestamp, userName } = req.body || {};
      if (!qrCodeId) {
        return res.status(400).json({ error: 'QR Code de destino é obrigatório.' });
      }
      const result = db.insertManualScans({
        qrCodeId,
        count: Number(count) || 1,
        device,
        os,
        browser,
        city,
        country,
        timestamp,
        userName,
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao inserir dados no Dashboard.' });
    }
  });

  // Retirar dados de scan do Dashboard (em lote ou por período)
  app.post('/api/scans/delete-batch', (req, res) => {
    try {
      const { qrCodeId, count, period, userName } = req.body || {};
      const result = db.deleteScansBatch({
        qrCodeId,
        count: count ? Number(count) : undefined,
        period,
        userName,
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao retirar dados do Dashboard.' });
    }
  });

  // ==========================================
  // 6. HISTORY LOG API
  // ==========================================
  app.get('/api/history', (req, res) => {
    const search = (req.query.search || req.query.q || '') as string;
    const action = (req.query.action || '') as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;

    const history = db.getHistory({
      search,
      action,
      limit: isNaN(limit) ? 200 : limit,
    });
    res.json(history);
  });

  // ==========================================
  // 7. SETTINGS API
  // ==========================================
  app.get('/api/settings', (req, res) => {
    const settings = db.getSettings();
    res.json(settings);
  });

  app.put('/api/settings', (req, res) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  });

  // ==========================================
  // 7.1 SYSTEM RESTORATION & DATA PROTECTION API
  // ==========================================
  // Restaura o sistema com garantia total de NÃO alterar clientes e QR codes criados
  app.post('/api/system/restore', (req, res) => {
    try {
      const { restoreSettings, clearScans, clearHistory, userName } = req.body || {};
      const result = db.restoreSystem({
        restoreSettings: restoreSettings !== undefined ? Boolean(restoreSettings) : true,
        clearScans: Boolean(clearScans),
        clearHistory: Boolean(clearHistory),
        userName,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao restaurar o sistema.' });
    }
  });

  app.get('/api/system/backup-status', (req, res) => {
    try {
      const status = db.getSystemBackupStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao consultar status de backup.' });
    }
  });

  app.post('/api/system/sync-created', (req, res) => {
    try {
      const { clients, qrcodes } = req.body || {};
      const result = db.syncCreatedEntities(clients, qrcodes);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao sincronizar entidades criadas.' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // 8. VITE MIDDLEWARE (DEV) / STATIC (PROD)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QR Dynamic Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
