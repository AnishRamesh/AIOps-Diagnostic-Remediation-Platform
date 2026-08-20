export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'ANALYZING' | 'PENDING_APPROVAL' | 'REMEDIATING' | 'RESOLVED' | 'FAILED';
export type RemediationStatus = 'NONE' | 'PENDING_APPROVAL' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'REJECTED';
export type RecoveryStatus = 'UNRESOLVED' | 'RECOVERING' | 'RECOVERED' | 'FAILED';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  phase: 'INGESTION' | 'EMBEDDING' | 'VECTOR_SEARCH' | 'RAG_ANALYSIS' | 'LLM_DIAGNOSIS' | 'SAFETY_CHECK' | 'REMEDIATION' | 'HEALTH_CHECK' | 'RECOVERY';
  title: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
  details?: Record<string, any>;
}

export interface Incident {
  id: string;
  incident_id: string;
  timestamp: string;
  app_name: string;
  environment: string;
  error_type: string;
  error_message: string;
  raw_log: string;
  stack_trace?: string;
  severity: Severity;
  status: IncidentStatus;
  
  // Vector RAG Fields
  embedding?: number[];
  retrieved_knowledge?: KnowledgeDoc[];
  
  // AI Diagnosis
  root_cause?: string;
  confidence?: number;
  ai_reasoning?: string;
  recommended_remediation?: string;
  
  // Auto-Remediation & Health
  remediation_status: RemediationStatus;
  recovery_status: RecoveryStatus;
  executed_remediation?: string;
  requires_manual_approval: boolean;
  manual_approval_granted?: boolean;
  
  // MTTR Metrics (in seconds)
  detection_timestamp: string;
  resolution_timestamp?: string;
  resolution_time_seconds?: number;
  manual_estimated_time_seconds: number;
  
  timeline: TimelineEvent[];
}

export interface KnowledgeDoc {
  id: string;
  error_pattern: string;
  category: string;
  description: string;
  root_cause: string;
  recommended_action: string;
  similarity_score?: number;
  metadata?: Record<string, any>;
}

export interface ApprovedRemediation {
  id: string;
  name: string;
  description: string;
  risk_level: 'SAFE' | 'MODERATE' | 'HIGH';
  target_service: string;
  estimated_execution_ms: number;
  script_code: string;
  enabled: boolean;
}

export interface SystemStatus {
  application: 'RUNNING' | 'DEGRADED' | 'DOWN';
  backend_fastapi: 'RUNNING' | 'DOWN';
  database_mongodb: 'CONNECTED' | 'DISCONNECTED';
  vector_chromadb: 'CONNECTED' | 'INDEXING' | 'DISCONNECTED';
  ai_engine_ollama: 'RUNNING' | 'DEGRADED' | 'DOWN';
  active_incidents: number;
  total_incidents: number;
  resolved_incidents: number;
  successful_remediations: number;
  failed_remediations: number;
  average_mttr_seconds: number;
  manual_avg_mttr_seconds: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  incident_id: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface FailureScenario {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  error_type: string;
  error_message: string;
  raw_log: string;
  stack_trace: string;
  expected_root_cause: string;
  expected_action: string;
  description: string;
}

export type UserRole = 'Lead Architect & Admin' | 'Senior SRE Specialist' | 'DevOps Engineer' | 'Security Auditor';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  title: string;
  role: UserRole;
  database: 'aiops_auth_db';
  collection: 'users';
  avatar?: string;
  permissions: string[];
  is_admin: boolean;
  is_lead_architect: boolean;
  last_login: string;
  created_at: string;
}

export interface LoginSession {
  id: string;
  session_token: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: UserRole;
  ip_address: string;
  user_agent: string;
  database: 'aiops_auth_db';
  collection: 'login_sessions';
  login_timestamp: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
}

export interface AuthAuditLog {
  id: string;
  timestamp: string;
  event_type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'ROLE_CHANGE' | 'SESSION_TERMINATED';
  user_email: string;
  user_name: string;
  database: 'aiops_auth_db';
  collection: 'auth_audit_logs';
  ip_address: string;
  details: string;
}
