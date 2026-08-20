import { Incident, SystemStatus, KnowledgeDoc, ApprovedRemediation, AuditLog, FailureScenario, User, LoginSession, AuthAuditLog } from '../types';

export const api = {
  // Auth API Methods (MongoDB: aiops_auth_db)
  async getAuthUser(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async login(usernameOrEmail?: string, password?: string): Promise<{ user: User; session: LoginSession }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email: usernameOrEmail, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid login credentials');
    }
    return data;
  },

  async logout(sessionId?: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!res.ok) throw new Error('Failed logging out');
    return res.json();
  },

  async getAuthDbInfo(): Promise<any> {
    const res = await fetch('/api/auth/db-info');
    if (!res.ok) throw new Error('Failed fetching auth DB info');
    return res.json();
  },

  async getAuthUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    if (!res.ok) throw new Error('Failed fetching users collection');
    return res.json();
  },

  async getAuthSessions(): Promise<LoginSession[]> {
    const res = await fetch('/api/auth/sessions');
    if (!res.ok) throw new Error('Failed fetching login_sessions collection');
    return res.json();
  },

  async getAuthAuditLogs(): Promise<AuthAuditLog[]> {
    const res = await fetch('/api/auth/logs');
    if (!res.ok) throw new Error('Failed fetching auth_audit_logs collection');
    return res.json();
  },

  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    if (!res.ok) throw new Error('Failed fetching system status');
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch('/api/incidents');
    if (!res.ok) throw new Error('Failed fetching incidents');
    return res.json();
  },

  async getIncidentById(id: string): Promise<Incident> {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) throw new Error('Failed fetching incident');
    return res.json();
  },

  async simulateFailure(payload: {
    scenario_id?: string;
    log_message?: string;
    error_type?: string;
    severity?: string;
    app_name?: string;
    stack_trace?: string;
  }): Promise<Incident> {
    const res = await fetch('/api/incidents/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed simulating failure');
    return res.json();
  },

  async executeRemediation(incidentId: string, actionId?: string): Promise<Incident> {
    const res = await fetch(`/api/remediations/${incidentId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: actionId })
    });
    if (!res.ok) throw new Error('Failed executing remediation');
    return res.json();
  },

  async getKnowledgeDocs(): Promise<KnowledgeDoc[]> {
    const res = await fetch('/api/knowledge');
    if (!res.ok) throw new Error('Failed fetching knowledge docs');
    return res.json();
  },

  async addKnowledgeDoc(doc: Omit<KnowledgeDoc, 'id'>): Promise<KnowledgeDoc> {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error('Failed adding knowledge doc');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed fetching audit logs');
    return res.json();
  },

  async getApprovedRemediations(): Promise<ApprovedRemediation[]> {
    const res = await fetch('/api/remediations/allowlist');
    if (!res.ok) throw new Error('Failed fetching allowlisted remediations');
    return res.json();
  },

  async getFailureScenarios(): Promise<FailureScenario[]> {
    const res = await fetch('/api/scenarios');
    if (!res.ok) throw new Error('Failed fetching failure scenarios');
    return res.json();
  },

  subscribeToSSE(onEvent: (event: { type: string; data: any; timestamp: string }) => void): () => void {
    if (typeof window === 'undefined' || !window.EventSource) {
      return () => {};
    }

    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onEvent(parsed);
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE EventSource error, attempting reconnect...', err);
    };

    return () => {
      eventSource.close();
    };
  }
};

