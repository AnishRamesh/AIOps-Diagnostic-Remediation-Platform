import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, FAILURE_SCENARIOS } from './src/backend/db';
import { authDb } from './src/backend/authDb';
import { chromaDB } from './src/backend/vectorStore';
import { remediationEngine } from './src/backend/remediationEngine';
import { ragDiagnosticService } from './src/backend/ragService';
import { connectMongo } from './src/backend/mongoClient';

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

  // ----------------------- SSE REAL-TIME BROADCASTER -----------------------
  const sseClients: express.Response[] = [];

  const broadcastSSE = (type: string, data: any) => {
    const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
    sseClients.forEach(client => {
      try {
        client.write(payload);
      } catch (err) {
        // Client connection dropped
      }
    });
  };

  // Wire broadcaster to RAG service
  ragDiagnosticService.setBroadcaster(broadcastSSE);

  // Periodic heartbeat keep-alive ping
  setInterval(() => {
    sseClients.forEach(client => {
      try {
        client.write(`: keep-alive\n\n`);
      } catch (e) {}
    });
  }, 15000);

  // SSE Stream Endpoint
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.push(res);

    // Initial greeting event
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'AIOps Real-Time Event Stream Connected', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) {
        sseClients.splice(idx, 1);
      }
    });
  });

  try {
    await connectMongo();
  } catch (err) {
    console.warn('MongoDB connection fallback: Using memory-buffered document store', err);
  }

  // ----------------------- API ROUTES -----------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AIOps Auto-Remediation Platform API',
      sse_active_clients: sseClients.length,
      timestamp: new Date().toISOString()
    });
  });

  // ----------------------- AUTH API ROUTES (MongoDB: aiops_auth_db) -----------------------
  app.get('/api/auth/me', (req, res) => {
    const activeUser = authDb.getActiveUser();
    if (!activeUser) {
      return res.status(401).json({ error: 'Unauthenticated', user: null });
    }
    res.json(activeUser);
  });

  app.get('/api/auth/db-info', (req, res) => {
    res.json(authDb.getDatabaseInfo());
  });

  app.get('/api/auth/users', (req, res) => {
    res.json(authDb.getUsers());
  });

  app.get('/api/auth/sessions', (req, res) => {
    res.json(authDb.getSessions());
  });

  app.get('/api/auth/logs', (req, res) => {
    res.json(authDb.getAuthAuditLogs());
  });

  app.post('/api/auth/login', (req, res) => {
    const { username_or_email, password } = req.body;
    const targetEmail = (username_or_email || '').trim();

    // Check @gmail.com requirement
    if (targetEmail.includes('@') && !targetEmail.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Invalid email address: Email address must end with @gmail.com' });
    }

    const authResult = authDb.authenticateUser(targetEmail || 'anishramesh18@gmail.com', password);

    if ('error' in authResult) {
      return res.status(400).json({ error: authResult.error });
    }

    if (!authResult || !authResult.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    broadcastSSE('auth_event', { event: 'LOGIN_SUCCESS', user_email: authResult.user.email });
    res.json(authResult);
  });

  app.post('/api/auth/logout', (req, res) => {
    const { session_id } = req.body;
    if (session_id) {
      authDb.terminateSession(session_id);
    }
    authDb.setActiveUser(null);
    broadcastSSE('auth_event', { event: 'LOGOUT' });
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/system/status', (req, res) => {
    res.json(db.getSystemStatus());
  });

  app.get('/api/incidents', (req, res) => {
    res.json(db.getIncidents());
  });

  app.get('/api/incidents/:id', (req, res) => {
    const incident = db.getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  });

  // Inject failure scenario or custom error log -> Runs RAG & Auto-Remediation Pipeline
  app.post('/api/incidents/simulate', async (req, res) => {
    try {
      const { scenario_id, log_message, error_type, severity, app_name, stack_trace } = req.body;

      let log = log_message;
      let errType = error_type || 'UnknownError';
      let sev = severity || 'HIGH';
      let appName = app_name || 'PaymentGateway-Service';
      let stack = stack_trace || '';

      if (scenario_id) {
        const scenario = FAILURE_SCENARIOS.find(s => s.id === scenario_id);
        if (scenario) {
          log = scenario.error_message;
          errType = scenario.error_type;
          sev = scenario.severity;
          stack = scenario.stack_trace;
        }
      }

      if (!log) {
        return res.status(400).json({ error: 'log_message or valid scenario_id is required' });
      }

      // Notify SSE subscribers that a log simulation has started
      broadcastSSE('log_ingested', { log_message: log, error_type: errType, severity: sev, app_name: appName });

      const processedIncident = await ragDiagnosticService.processLogAndRemediate(log, errType, sev, appName, stack);
      res.json(processedIncident);
    } catch (err: any) {
      console.error('Failure simulation error:', err);
      res.status(500).json({ error: err?.message || 'Failed processing incident simulation' });
    }
  });

  // Execute or Manual Approval for Remediation
  app.post('/api/remediations/:id/execute', async (req, res) => {
    try {
      const incidentId = req.params.id;
      const { action_id } = req.body;

      const inc = db.getIncidentById(incidentId);
      if (!inc) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      const targetAction = action_id || inc.recommended_remediation;
      if (!targetAction) {
        return res.status(400).json({ error: 'No remediation action specified' });
      }

      const updatedIncident = await ragDiagnosticService.executeRemediationAndRecover(inc.id, targetAction);
      res.json(updatedIncident);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Remediation execution failed' });
    }
  });

  // Knowledge Base (ChromaDB Vector Store Endpoints)
  app.get('/api/knowledge', (req, res) => {
    res.json(chromaDB.getKnowledgeDocs());
  });

  app.post('/api/knowledge', (req, res) => {
    const { error_pattern, category, description, root_cause, recommended_action } = req.body;
    if (!error_pattern || !root_cause || !recommended_action) {
      return res.status(400).json({ error: 'error_pattern, root_cause, and recommended_action are required' });
    }
    const newDoc = chromaDB.addKnowledgeDoc({
      error_pattern,
      category: category || 'Custom Category',
      description: description || '',
      root_cause,
      recommended_action
    });
    res.json(newDoc);
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    res.json(db.getAuditLogs());
  });

  // Allowlisted Remediation Actions
  app.get('/api/remediations/allowlist', (req, res) => {
    res.json(remediationEngine.getApprovedActions());
  });

  // Test Failure Scenarios list
  app.get('/api/scenarios', (req, res) => {
    res.json(FAILURE_SCENARIOS);
  });

  // ----------------------- VITE MIDDLEWARE SETUP -----------------------
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
    console.log(`[AIOps Platform Server] Express API running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
