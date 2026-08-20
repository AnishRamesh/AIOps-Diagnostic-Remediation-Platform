import { Incident, AuditLog, SystemStatus, FailureScenario } from '../types';

// Failure Scenario Templates for Simulation
export const FAILURE_SCENARIOS: FailureScenario[] = [
  {
    id: 'sc-1',
    title: 'Database Connection Timeout',
    category: 'Database Failure',
    severity: 'HIGH',
    error_type: 'MongoNetworkTimeoutError',
    error_message: 'Connection timeout after 30 seconds while waiting for socket write from cluster host 10.0.4.12:27017',
    raw_log: '2026-08-09T01:12:04.102Z [ERROR] [app.db.pool] MongoNetworkTimeoutError: connection timed out after 30000ms. PoolClearedError: connection pool cleared for host 10.0.4.12:27017.',
    stack_trace: `MongoNetworkTimeoutError: connection timed out
    at Connection.failure (/app/node_modules/mongodb/lib/cmap/connection.js:291:15)
    at Socket.<anonymous> (/app/node_modules/mongodb/lib/cmap/connection.js:142:21)
    at Socket.emit (node:events:517:28)
    at Socket._onTimeout (node:net:588:12)`,
    expected_root_cause: 'MongoDB service connection pool max overflow due to unclosed database connections during peak load.',
    expected_action: 'restart_database',
    description: 'Simulates socket connection timeout when primary MongoDB daemon becomes unresponsive or pool max overflow occurs.'
  },
  {
    id: 'sc-2',
    title: 'Heap Memory Exhaustion Crash',
    category: 'Resource Limit',
    severity: 'CRITICAL',
    error_type: 'FATAL ERROR',
    error_message: 'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
    raw_log: '2026-08-09T01:14:22.881Z [FATAL] [node.v8] FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory. Current heap usage: 2048MB / 2048MB.',
    stack_trace: `<--- Last few GCs --->
[1042:0x64b8200] 128492 ms: Mark-Sweep 2043.2 (2048.0) MB -> 2041.8 (2048.0) MB (average mu = 0.121)
[1042:0x64b8200] 129104 ms: Mark-Sweep 2045.1 (2048.0) MB -> 2044.2 (2048.0) MB (average mu = 0.052)
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`,
    expected_root_cause: 'Node.js process heap memory exhaustion caused by unbounded log caching buffer.',
    expected_action: 'restart_application',
    description: 'Simulates memory leak causing process crash when garbage collector cannot reclaim V8 heap RAM.'
  },
  {
    id: 'sc-3',
    title: 'Hung Background Worker Deadlock',
    category: 'Concurrency',
    severity: 'HIGH',
    error_type: 'WorkerQueueBlockage',
    error_message: 'ThreadPoolExecutor stuck: lock contention in background task queue worker #4. Queue length: 1420',
    raw_log: '2026-08-09T01:18:10.005Z [WARN] [app.worker] WorkerQueueBlockage: Worker thread #4 locked on queue mutex. Task execution latency exceeded 600s threshold.',
    stack_trace: `WorkerQueueBlockage: lock contention
    at ThreadPoolExecutor._worker (python/concurrent/futures/thread.py:81)
    at Lock.acquire (python/threading.py:108)
    at app.services.worker.process_queue (app/services/worker.py:142)`,
    expected_root_cause: 'Worker threads stuck in deadlocked queue wait loop causing background task processing to freeze.',
    expected_action: 'restart_worker',
    description: 'Simulates circular lock wait in asynchronous task processor causing background queue to halt.'
  },
  {
    id: 'sc-4',
    title: 'Socket Port 8080 Collision',
    category: 'Network Socket',
    severity: 'MEDIUM',
    error_type: 'EADDRINUSE',
    error_message: 'listen EADDRINUSE: address already in use 0.0.0.0:8080',
    raw_log: '2026-08-09T01:21:55.430Z [ERROR] [app.server] Error: listen EADDRINUSE: address already in use 0.0.0.0:8080. Daemon failed to start.',
    stack_trace: `Error: listen EADDRINUSE: address already in use 0.0.0.0:8080
    at Server.setupCmdServer (node:net:1483:16)
    at listenInCluster (node:net:1531:12)
    at Server.listen (node:net:1619:7)`,
    expected_root_cause: 'Socket port 8080 occupied by lingering orphaned daemon process.',
    expected_action: 'kill_port_process',
    description: 'Simulates port collision during application start when a previous zombie process holds the TCP socket open.'
  },
  {
    id: 'sc-5',
    title: 'Corrupted Application JSON Config',
    category: 'Configuration',
    severity: 'MEDIUM',
    error_type: 'JSONDecodeError',
    error_message: 'JSONDecodeError: Expecting property name enclosed in double quotes: line 24 column 5 (char 612) in app_config.json',
    raw_log: '2026-08-09T01:25:30.120Z [FATAL] [app.config] JSONDecodeError: Failed parsing /app/config/app_config.json at position 612. Invalid JSON trailing comma.',
    stack_trace: `JSONDecodeError: Expecting property name
    at json.decoder.raw_decode (python/json/decoder.py:353)
    at json.loads (python/json/__init__.py:346)
    at app.config.load_config (app/config.py:42)`,
    expected_root_cause: 'Malformed JSON syntax error in dynamic application configuration file.',
    expected_action: 'restore_configuration',
    description: 'Simulates syntax error introduced in application configuration file during deployment or update.'
  },
  {
    id: 'sc-6',
    title: 'Disk Storage Threshold Overflow',
    category: 'Storage',
    severity: 'HIGH',
    error_type: 'ENOSPC',
    error_message: 'ENOSPC: no space left on device, write error on /tmp/app_scratch_buffer.tmp',
    raw_log: '2026-08-09T01:28:44.901Z [ERROR] [app.storage] ENOSPC: no space left on device. Disk usage 100% on mount volume /tmp.',
    stack_trace: `Error: ENOSPC: no space left on device, write
    at Object.writeSync (node:fs:982:3)
    at Object.writeFileSync (node:fs:2287:26)
    at LogStorage.flushBuffer (app/storage.js:88)`,
    expected_root_cause: 'Disk space exhausted on temporary mount volume due to uncleaned log rotation buffers.',
    expected_action: 'clear_temp_files',
    description: 'Simulates storage capacity failure when temporary directory reaches 100% disk usage.'
  }
];

class MongoDBDatabase {
  private incidents: Incident[] = [];
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed historical incidents for realistic MTTR calculations and graphs
    const now = new Date();
    
    // Seed 1: Resolved DB Timeout
    const inc1Start = new Date(now.getTime() - 3600 * 1000 * 4);
    const inc1End = new Date(inc1Start.getTime() + 14 * 1000);
    this.incidents.push({
      id: 'inc-101',
      incident_id: 'INC-2026-0801',
      timestamp: inc1Start.toISOString(),
      app_name: 'PaymentGateway-Service',
      environment: 'Production-UsEast',
      error_type: 'MongoNetworkTimeoutError',
      error_message: 'Connection timeout after 30 seconds while waiting for socket write',
      raw_log: '2026-08-09T00:10:00Z [ERROR] MongoNetworkTimeoutError: connection timed out after 30000ms.',
      severity: 'HIGH',
      status: 'RESOLVED',
      root_cause: 'MongoDB connection pool max overflow due to unclosed database connections.',
      confidence: 0.94,
      ai_reasoning: 'Matches known MongoDB connection pool exhaustion pattern with 94% vector similarity score.',
      recommended_remediation: 'restart_database',
      remediation_status: 'SUCCESS',
      recovery_status: 'RECOVERED',
      executed_remediation: 'restart_database',
      requires_manual_approval: false,
      manual_approval_granted: true,
      detection_timestamp: inc1Start.toISOString(),
      resolution_timestamp: inc1End.toISOString(),
      resolution_time_seconds: 14,
      manual_estimated_time_seconds: 1200, // 20 mins manual debugging
      timeline: [
        { id: 't1', timestamp: inc1Start.toISOString(), phase: 'INGESTION', title: 'Error Log Ingested', description: 'Log monitoring detected MongoNetworkTimeoutError', status: 'error' },
        { id: 't2', timestamp: new Date(inc1Start.getTime() + 2000).toISOString(), phase: 'VECTOR_SEARCH', title: 'ChromaDB Match', description: 'Retrieved troubleshooting doc kb-001 with 0.94 similarity', status: 'info' },
        { id: 't3', timestamp: new Date(inc1Start.getTime() + 4000).toISOString(), phase: 'LLM_DIAGNOSIS', title: 'LLaMA 3 Diagnosis', description: 'Identified connection pool exhaustion. Recommended restart_database with 94% confidence.', status: 'info' },
        { id: 't4', timestamp: new Date(inc1Start.getTime() + 6000).toISOString(), phase: 'SAFETY_CHECK', title: 'Allowlist Validated', description: 'Action restart_database is approved in security policy.', status: 'success' },
        { id: 't5', timestamp: new Date(inc1Start.getTime() + 10000).toISOString(), phase: 'REMEDIATION', title: 'Action Executed', description: 'Database service connection pools flushed and service restarted.', status: 'success' },
        { id: 't6', timestamp: inc1End.toISOString(), phase: 'RECOVERY', title: 'Health Verified', description: 'Health check ping HTTP 200 OK. Application fully recovered.', status: 'success' }
      ]
    });

    // Seed 2: Resolved Memory Leak
    const inc2Start = new Date(now.getTime() - 3600 * 1000 * 2);
    const inc2End = new Date(inc2Start.getTime() + 11 * 1000);
    this.incidents.push({
      id: 'inc-102',
      incident_id: 'INC-2026-0802',
      timestamp: inc2Start.toISOString(),
      app_name: 'AnalyticsEngine-Worker',
      environment: 'Production-EU',
      error_type: 'FATAL ERROR',
      error_message: 'JavaScript heap out of memory - heap allocation failed 2048MB',
      raw_log: '2026-08-09T01:00:00Z [FATAL] JavaScript heap out of memory',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      root_cause: 'V8 Garbage Collector heap memory exhaustion caused by memory leak.',
      confidence: 0.96,
      ai_reasoning: 'Vector search retrieved kb-002 with 0.96 cosine similarity.',
      recommended_remediation: 'restart_application',
      remediation_status: 'SUCCESS',
      recovery_status: 'RECOVERED',
      executed_remediation: 'restart_application',
      requires_manual_approval: false,
      detection_timestamp: inc2Start.toISOString(),
      resolution_timestamp: inc2End.toISOString(),
      resolution_time_seconds: 11,
      manual_estimated_time_seconds: 1800, // 30 mins manual
      timeline: [
        { id: 't1', timestamp: inc2Start.toISOString(), phase: 'INGESTION', title: 'Error Log Ingested', description: 'Log monitoring detected JavaScript heap limit allocation crash', status: 'error' },
        { id: 't2', timestamp: inc2End.toISOString(), phase: 'RECOVERY', title: 'Auto-Remediated', description: 'Application restarted cleanly in 11 seconds.', status: 'success' }
      ]
    });

    // Audit logs
    this.auditLogs.push(
      {
        id: 'aud-001',
        timestamp: inc1End.toISOString(),
        action: 'EXECUTE_REMEDIATION',
        actor: 'AIOps Auto-Remediation Engine',
        incident_id: 'INC-2026-0801',
        details: 'Executed restart_database. Confidence score 0.94 >= 0.90 threshold.',
        status: 'SUCCESS'
      },
      {
        id: 'aud-002',
        timestamp: inc2End.toISOString(),
        action: 'EXECUTE_REMEDIATION',
        actor: 'AIOps Auto-Remediation Engine',
        incident_id: 'INC-2026-0802',
        details: 'Executed restart_application. Confidence score 0.96 >= 0.90 threshold.',
        status: 'SUCCESS'
      }
    );
  }

  public getIncidents(): Incident[] {
    return [...this.incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find(i => i.id === id || i.incident_id === id);
  }

  public addIncident(incident: Incident): Incident {
    this.incidents.unshift(incident);
    this.addAuditLog({
      action: 'CREATE_INCIDENT',
      actor: 'Log Monitoring System',
      incident_id: incident.incident_id,
      details: `Detected new incident ${incident.incident_id} [${incident.severity}] ${incident.error_type}`,
      status: 'SUCCESS'
    });
    return incident;
  }

  public updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const idx = this.incidents.findIndex(i => i.id === id || i.incident_id === id);
    if (idx === -1) return undefined;
    
    this.incidents[idx] = {
      ...this.incidents[idx],
      ...updates
    };
    return this.incidents[idx];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  public getSystemStatus(): SystemStatus {
    const total = this.incidents.length;
    const active = this.incidents.filter(i => i.status !== 'RESOLVED').length;
    const resolved = this.incidents.filter(i => i.status === 'RESOLVED').length;
    const successfulRemediations = this.incidents.filter(i => i.remediation_status === 'SUCCESS').length;
    const failedRemediations = this.incidents.filter(i => i.remediation_status === 'FAILED' || i.remediation_status === 'REJECTED').length;

    // Calculate actual AIOps average MTTR (seconds)
    const resolvedWithTime = this.incidents.filter(i => i.status === 'RESOLVED' && i.resolution_time_seconds !== undefined);
    const totalAIOpsSeconds = resolvedWithTime.reduce((sum, i) => sum + (i.resolution_time_seconds || 0), 0);
    const avgAIOpsMttr = resolvedWithTime.length > 0 ? Math.round(totalAIOpsSeconds / resolvedWithTime.length) : 12;

    // Calculate estimated manual MTTR (seconds)
    const totalManualSeconds = resolvedWithTime.reduce((sum, i) => sum + (i.manual_estimated_time_seconds || 1500), 0);
    const avgManualMttr = resolvedWithTime.length > 0 ? Math.round(totalManualSeconds / resolvedWithTime.length) : 1500;

    return {
      application: active > 0 ? (active > 2 ? 'DOWN' : 'DEGRADED') : 'RUNNING',
      backend_fastapi: 'RUNNING',
      database_mongodb: 'CONNECTED',
      vector_chromadb: 'CONNECTED',
      ai_engine_ollama: 'RUNNING',
      active_incidents: active,
      total_incidents: total,
      resolved_incidents: resolved,
      successful_remediations: successfulRemediations,
      failed_remediations: failedRemediations,
      average_mttr_seconds: avgAIOpsMttr,
      manual_avg_mttr_seconds: avgManualMttr
    };
  }
}

export const db = new MongoDBDatabase();
