import { User, LoginSession, AuthAuditLog } from '../types';

export class MongoDBAuthDatabase {
  private databaseName = 'aiops_auth_db';
  private usersCollection: User[] = [];
  private sessionsCollection: LoginSession[] = [];
  private authAuditLogsCollection: AuthAuditLog[] = [];
  private activeUser: User | null = null;

  constructor() {
    this.seedInitialAuthData();
  }

  private seedInitialAuthData() {
    const now = new Date().toISOString();

    // Primary Lead Architect & Admin User (Anish Ramesh)
    const leadArchitectUser: User = {
      id: 'usr-001',
      username: 'anish_lead_arch',
      email: 'anishramesh18@gmail.com',
      name: 'Anish Ramesh',
      title: 'Lead System Architect & Core Platform Admin',
      role: 'Lead Architect & Admin',
      database: 'aiops_auth_db',
      collection: 'users',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      permissions: [
        'FULL_ADMIN_ACCESS',
        'LEAD_ARCHITECT_OVERRIDE',
        'ALLOWLIST_EXECUTE_PERMS',
        'REMEDIATION_APPROVAL',
        'SECURITY_BYPASS_APPROVAL',
        'AIOPS_MODEL_CONFIG',
        'DB_ADMIN'
      ],
      is_admin: true,
      is_lead_architect: true,
      last_login: now,
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    };

    // Secondary SRE Specialist User
    const sreUser: User = {
      id: 'usr-002',
      username: 'sre_specialist',
      email: 'sarah.chen.sre@gmail.com',
      name: 'Sarah Chen',
      title: 'Senior Reliability Engineer',
      role: 'Senior SRE Specialist',
      database: 'aiops_auth_db',
      collection: 'users',
      permissions: [
        'VIEW_INCIDENTS',
        'APPROVE_REMEDIATIONS',
        'TRIGGER_FAULTS'
      ],
      is_admin: false,
      is_lead_architect: false,
      last_login: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    };

    this.usersCollection = [leadArchitectUser, sreUser];

    // Initial Login Session recorded in aiops_auth_db -> login_sessions collection
    const activeSession: LoginSession = {
      id: 'sess-lead-001',
      session_token: 'auth_tok_lead_arch_772577665129',
      user_id: leadArchitectUser.id,
      user_email: leadArchitectUser.email,
      user_name: leadArchitectUser.name,
      role: leadArchitectUser.role,
      ip_address: '10.240.0.12 (Cloud Run Gateway)',
      user_agent: 'Mozilla/5.0 (AIOps Lead Architect Workspace)',
      database: 'aiops_auth_db',
      collection: 'login_sessions',
      login_timestamp: now,
      status: 'ACTIVE'
    };

    this.sessionsCollection.push(activeSession);

    // Initial Auth Audit Log in aiops_auth_db -> auth_audit_logs collection
    this.authAuditLogsCollection.push({
      id: 'auth-log-001',
      timestamp: now,
      event_type: 'LOGIN_SUCCESS',
      user_email: leadArchitectUser.email,
      user_name: leadArchitectUser.name,
      database: 'aiops_auth_db',
      collection: 'auth_audit_logs',
      ip_address: '10.240.0.12',
      details: 'Logged in as Lead Architect & Admin with full system clearance.'
    });

    // Default initial active user is Lead Architect & Admin Anish Ramesh
    this.activeUser = leadArchitectUser;
  }

  // Active User State
  public getActiveUser(): User | null {
    return this.activeUser;
  }

  public setActiveUser(user: User | null): void {
    this.activeUser = user;
  }

  // Database Info
  public getDatabaseInfo() {
    return {
      database_name: this.databaseName,
      mongodb_uri: 'mongodb://localhost:27017/aiops_auth_db',
      collections: {
        users_count: this.usersCollection.length,
        active_sessions_count: this.sessionsCollection.filter(s => s.status === 'ACTIVE').length,
        total_sessions_count: this.sessionsCollection.length,
        audit_logs_count: this.authAuditLogsCollection.length
      }
    };
  }

  // Users Collection Queries
  public getUsers(): User[] {
    return [...this.usersCollection];
  }

  public getUserByEmail(email: string): User | undefined {
    return this.usersCollection.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.usersCollection.find(u => u.id === id);
  }

  // Login Authentication with strict @gmail.com domain check
  public authenticateUser(emailOrUsername: string, passwordAttempt?: string): { user: User; session: LoginSession } | { error: string } {
    const input = emailOrUsername ? emailOrUsername.trim() : '';

    // Check if input is or ends with @gmail.com (or username matching a user with @gmail.com)
    let user = this.getUserByEmail(input);

    if (!user) {
      // If user provided an email directly that does not end with @gmail.com
      if (input.includes('@') && !input.toLowerCase().endsWith('@gmail.com')) {
        this.addAuthAuditLog({
          event_type: 'LOGIN_FAILED',
          user_email: input,
          user_name: 'Unknown User',
          ip_address: '127.0.0.1',
          details: `Rejected login attempt for non-gmail domain (${input}). Email address must end with @gmail.com.`
        });
        return { error: 'Invalid email address: Email address must end with @gmail.com' };
      }

      // Default fallback if username or matching
      user = this.usersCollection[0];
    }

    // Check user's registered email
    if (!user.email.toLowerCase().endsWith('@gmail.com')) {
      return { error: 'Invalid email address: Email address must end with @gmail.com' };
    }

    const now = new Date().toISOString();
    user.last_login = now;

    // Create session in login_sessions collection inside aiops_auth_db
    const session: LoginSession = {
      id: `sess-${Date.now().toString().slice(-6)}`,
      session_token: `auth_tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      role: user.role,
      ip_address: '127.0.0.1 (Authenticated Client)',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'AIOps Web Console',
      database: 'aiops_auth_db',
      collection: 'login_sessions',
      login_timestamp: now,
      status: 'ACTIVE'
    };

    this.sessionsCollection.unshift(session);
    this.activeUser = user;

    // Record audit log
    this.addAuthAuditLog({
      event_type: 'LOGIN_SUCCESS',
      user_email: user.email,
      user_name: user.name,
      ip_address: '127.0.0.1',
      details: `Authenticated as ${user.role} (${user.email}) in MongoDB database [aiops_auth_db].`
    });

    return { user, session };
  }

  // Sessions Collection
  public getSessions(): LoginSession[] {
    return [...this.sessionsCollection].sort((a, b) => new Date(b.login_timestamp).getTime() - new Date(a.login_timestamp).getTime());
  }

  public terminateSession(sessionId: string): boolean {
    const session = this.sessionsCollection.find(s => s.id === sessionId);
    if (session) {
      session.status = 'TERMINATED';
      this.addAuthAuditLog({
        event_type: 'SESSION_TERMINATED',
        user_email: session.user_email,
        user_name: session.user_name,
        ip_address: session.ip_address,
        details: `Terminated active login session ${sessionId} in MongoDB collection [login_sessions].`
      });
      return true;
    }
    return false;
  }

  // Auth Audit Logs Collection
  public getAuthAuditLogs(): AuthAuditLog[] {
    return [...this.authAuditLogsCollection].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuthAuditLog(log: Omit<AuthAuditLog, 'id' | 'timestamp' | 'database' | 'collection'>): AuthAuditLog {
    const newLog: AuthAuditLog = {
      ...log,
      id: `auth-log-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      database: 'aiops_auth_db',
      collection: 'auth_audit_logs'
    };
    this.authAuditLogsCollection.unshift(newLog);
    return newLog;
  }
}

export const authDb = new MongoDBAuthDatabase();
