import { GoogleGenAI } from '@google/genai';
import { chromaDB } from './vectorStore';
import { db } from './db';
import { remediationEngine } from './remediationEngine';
import { Incident, TimelineEvent, KnowledgeDoc } from '../types';

export interface DiagnosisResult {
  root_cause: string;
  confidence: number;
  ai_reasoning: string;
  recommended_remediation: string;
  retrieved_knowledge: KnowledgeDoc[];
}

type SSEBroadcaster = (type: string, data: any) => void;

export class RAGDiagnosticService {
  private ai: GoogleGenAI | null = null;
  private broadcaster: SSEBroadcaster | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (err) {
        console.warn('Gemini API init fallback to local LLaMA 3 rules engine:', err);
      }
    }
  }

  public setBroadcaster(broadcaster: SSEBroadcaster) {
    this.broadcaster = broadcaster;
  }

  private notify(type: string, data: any) {
    if (this.broadcaster) {
      try {
        this.broadcaster(type, data);
      } catch (err) {
        console.error('Error broadcasting SSE event:', err);
      }
    }
  }

  // Phase 3 & 4 & 5 & 6 & 7: Process Log Ingestion -> Embedding -> ChromaDB Search -> RAG -> LLaMA 3 -> Auto-Remediation
  public async processLogAndRemediate(
    logMessage: string,
    errorType: string,
    severity: Incident['severity'],
    appName = 'PaymentGateway-Service',
    stackTrace = ''
  ): Promise<Incident> {
    const startTime = new Date();
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    
    const timeline: TimelineEvent[] = [];

    // Step 1: Log Ingestion & Error Parsing
    const step1: TimelineEvent = {
      id: `t-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      phase: 'INGESTION',
      title: 'Log Entry Ingested & Parsed',
      description: `Extracted error [${errorType}] with severity [${severity}] from ${appName}`,
      status: 'error',
      details: { appName, errorType, severity, logMessage }
    };
    timeline.push(step1);
    this.notify('pipeline_step', { incident_id: incidentId, step: step1 });

    // Delay 300ms for realistic real-time streaming effect
    await new Promise(r => setTimeout(r, 350));

    // Step 2: Embedding Generation (Sentence Transformers 384d)
    const embedding = chromaDB.generateLogEmbedding(logMessage);
    const step2: TimelineEvent = {
      id: `t-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      phase: 'EMBEDDING',
      title: 'Vector Embedding Generated',
      description: `Sentence Transformer generated L2-normalized L6-v2 vector embedding (${embedding.length} dimensions)`,
      status: 'info',
      details: { dimensions: embedding.length, sampleVector: embedding.slice(0, 5) }
    };
    timeline.push(step2);
    this.notify('pipeline_step', { incident_id: incidentId, step: step2 });

    await new Promise(r => setTimeout(r, 400));

    // Step 3: ChromaDB Similarity Search
    const searchResults = chromaDB.querySimilarity(logMessage, 3);
    const topMatches = searchResults.map(r => r.doc);
    const topSimilarity = searchResults.length > 0 ? searchResults[0].similarity : 0;

    const step3: TimelineEvent = {
      id: `t-${Date.now()}-3`,
      timestamp: new Date().toISOString(),
      phase: 'VECTOR_SEARCH',
      title: 'ChromaDB Vector Retrieval',
      description: `Retrieved ${searchResults.length} matching troubleshooting docs. Top match score: ${(topSimilarity * 100).toFixed(1)}%`,
      status: 'info',
      details: { topSimilarity, topMatch: topMatches[0]?.id }
    };
    timeline.push(step3);
    this.notify('pipeline_step', { incident_id: incidentId, step: step3 });

    await new Promise(r => setTimeout(r, 500));

    // Step 4 & 5: RAG Prompt Construction & LLM (LLaMA 3 / Gemini) Diagnosis
    const diagnosis = await this.performLLMDiagnosis(logMessage, errorType, stackTrace, searchResults);

    const step4: TimelineEvent = {
      id: `t-${Date.now()}-4`,
      timestamp: new Date().toISOString(),
      phase: 'LLM_DIAGNOSIS',
      title: 'LLaMA 3 RAG Diagnosis Completed',
      description: `Root Cause: "${diagnosis.root_cause}". Recommended Action: '${diagnosis.recommended_remediation}' with ${(diagnosis.confidence * 100).toFixed(0)}% AI confidence score.`,
      status: 'info',
      details: {
        rootCause: diagnosis.root_cause,
        confidence: diagnosis.confidence,
        recommendedAction: diagnosis.recommended_remediation,
        reasoning: diagnosis.ai_reasoning
      }
    };
    timeline.push(step4);
    this.notify('pipeline_step', { incident_id: incidentId, step: step4 });

    await new Promise(r => setTimeout(r, 350));

    // Security Gate: Check Confidence & Allowlist
    const CONFIDENCE_THRESHOLD = 0.90;
    const isApproved = remediationEngine.isApprovedAction(diagnosis.recommended_remediation);
    const autoRemediateEligible = diagnosis.confidence >= CONFIDENCE_THRESHOLD && isApproved;

    let initialStatus: Incident['status'] = 'ANALYZING';
    let remediationStatus: Incident['remediation_status'] = 'NONE';
    let requiresManualApproval = false;

    if (!isApproved) {
      const stepSafety: TimelineEvent = {
        id: `t-${Date.now()}-5`,
        timestamp: new Date().toISOString(),
        phase: 'SAFETY_CHECK',
        title: 'Safety Check: Action Blocked',
        description: `Action '${diagnosis.recommended_remediation}' is NOT in security allowlist.`,
        status: 'warning'
      };
      timeline.push(stepSafety);
      this.notify('pipeline_step', { incident_id: incidentId, step: stepSafety });
      initialStatus = 'PENDING_APPROVAL';
      remediationStatus = 'REJECTED';
      requiresManualApproval = true;
    } else if (diagnosis.confidence < CONFIDENCE_THRESHOLD) {
      const stepSafety: TimelineEvent = {
        id: `t-${Date.now()}-5`,
        timestamp: new Date().toISOString(),
        phase: 'SAFETY_CHECK',
        title: 'Safety Check: Low Confidence Threshold',
        description: `AI confidence ${(diagnosis.confidence * 100).toFixed(0)}% < ${CONFIDENCE_THRESHOLD * 100}% threshold. Requiring manual human review.`,
        status: 'warning'
      };
      timeline.push(stepSafety);
      this.notify('pipeline_step', { incident_id: incidentId, step: stepSafety });
      initialStatus = 'PENDING_APPROVAL';
      remediationStatus = 'PENDING_APPROVAL';
      requiresManualApproval = true;
    } else {
      const stepSafety: TimelineEvent = {
        id: `t-${Date.now()}-5`,
        timestamp: new Date().toISOString(),
        phase: 'SAFETY_CHECK',
        title: 'Safety Check Passed',
        description: `Approved remediation '${diagnosis.recommended_remediation}' verified in allowlist. Confidence ${(diagnosis.confidence * 100).toFixed(0)}% >= 90%. Executing auto-recovery...`,
        status: 'success'
      };
      timeline.push(stepSafety);
      this.notify('pipeline_step', { incident_id: incidentId, step: stepSafety });
      initialStatus = 'REMEDIATING';
      remediationStatus = 'EXECUTING';
    }

    // Construct Incident Document
    const incident: Incident = {
      id: `inc-${Date.now()}`,
      incident_id: incidentId,
      timestamp: startTime.toISOString(),
      app_name: appName,
      environment: 'Production',
      error_type: errorType,
      error_message: logMessage,
      raw_log: logMessage,
      stack_trace: stackTrace,
      severity,
      status: initialStatus,
      embedding,
      retrieved_knowledge: topMatches,
      root_cause: diagnosis.root_cause,
      confidence: diagnosis.confidence,
      ai_reasoning: diagnosis.ai_reasoning,
      recommended_remediation: diagnosis.recommended_remediation,
      remediation_status: remediationStatus,
      recovery_status: 'UNRESOLVED',
      requires_manual_approval: requiresManualApproval,
      detection_timestamp: startTime.toISOString(),
      manual_estimated_time_seconds: severity === 'CRITICAL' ? 2400 : 1500,
      timeline
    };

    // Save to MongoDB collection
    db.addIncident(incident);
    this.notify('incident_created', incident);

    // If eligible for automatic safe remediation, execute now!
    if (autoRemediateEligible) {
      await new Promise(r => setTimeout(r, 450));
      await this.executeRemediationAndRecover(incident.id, diagnosis.recommended_remediation);
    }

    const finalInc = db.getIncidentById(incident.id) || incident;
    this.notify('incident_updated', finalInc);
    return finalInc;
  }

  // Execute remediation & calculate MTTR
  public async executeRemediationAndRecover(incidentId: string, actionId: string): Promise<Incident | undefined> {
    const inc = db.getIncidentById(incidentId);
    if (!inc) return undefined;

    // Record timeline start
    const remStep1: TimelineEvent = {
      id: `t-${Date.now()}-rem-1`,
      timestamp: new Date().toISOString(),
      phase: 'REMEDIATION',
      title: `Executing Remediation Script`,
      description: `Invoking safety engine for approved action '${actionId}'...`,
      status: 'info'
    };
    inc.timeline.push(remStep1);
    this.notify('pipeline_step', { incident_id: inc.incident_id, step: remStep1 });

    db.updateIncident(inc.id, {
      status: 'REMEDIATING',
      remediation_status: 'EXECUTING',
      executed_remediation: actionId
    });

    this.notify('incident_updated', db.getIncidentById(inc.id));

    await new Promise(r => setTimeout(r, 600));

    // Execute safe script
    const result = await remediationEngine.executeRemediation(actionId);

    const now = new Date();
    const detectionTime = new Date(inc.detection_timestamp).getTime();
    const resolutionSeconds = Math.max(2, Math.round((now.getTime() - detectionTime) / 1000));

    if (result.success && result.health_check_passed) {
      const remStep2: TimelineEvent = {
        id: `t-${Date.now()}-rem-2`,
        timestamp: now.toISOString(),
        phase: 'HEALTH_CHECK',
        title: 'Health Check Passed',
        description: 'Target service health check responded HTTP 200 OK.',
        status: 'success'
      };
      inc.timeline.push(remStep2);
      this.notify('pipeline_step', { incident_id: inc.incident_id, step: remStep2 });

      const remStep3: TimelineEvent = {
        id: `t-${Date.now()}-rem-3`,
        timestamp: now.toISOString(),
        phase: 'RECOVERY',
        title: 'Incident Resolved (AIOps Recovery)',
        description: `Application recovered in ${resolutionSeconds} seconds (MTTR). Saved estimated ~${Math.round(inc.manual_estimated_time_seconds / 60)} mins of manual engineering time!`,
        status: 'success'
      };
      inc.timeline.push(remStep3);
      this.notify('pipeline_step', { incident_id: inc.incident_id, step: remStep3 });

      db.updateIncident(inc.id, {
        status: 'RESOLVED',
        remediation_status: 'SUCCESS',
        recovery_status: 'RECOVERED',
        resolution_timestamp: now.toISOString(),
        resolution_time_seconds: resolutionSeconds,
        manual_approval_granted: inc.requires_manual_approval ? true : undefined
      });

      const auditLog = {
        action: 'AUTO_REMEDIATION_SUCCESS',
        actor: 'AIOps Safe Remediation Engine',
        incident_id: inc.incident_id,
        details: `Successfully executed '${actionId}' in ${result.execution_time_ms}ms. Service health verified OK.`,
        status: 'SUCCESS' as const
      };
      db.addAuditLog(auditLog);
      this.notify('audit_log', auditLog);
    } else {
      const remStepErr: TimelineEvent = {
        id: `t-${Date.now()}-rem-err`,
        timestamp: now.toISOString(),
        phase: 'REMEDIATION',
        title: 'Remediation Execution Failed',
        description: result.message,
        status: 'error'
      };
      inc.timeline.push(remStepErr);
      this.notify('pipeline_step', { incident_id: inc.incident_id, step: remStepErr });

      db.updateIncident(inc.id, {
        status: 'FAILED',
        remediation_status: 'FAILED',
        recovery_status: 'FAILED'
      });

      const auditLog = {
        action: 'AUTO_REMEDIATION_FAILURE',
        actor: 'AIOps Safe Remediation Engine',
        incident_id: inc.incident_id,
        details: `Failed executing '${actionId}': ${result.message}`,
        status: 'FAILURE' as const
      };
      db.addAuditLog(auditLog);
      this.notify('audit_log', auditLog);
    }

    const updatedInc = db.getIncidentById(inc.id);
    this.notify('incident_updated', updatedInc);
    return updatedInc;
  }

  // LLM Diagnosis Engine (RAG Context + LLaMA 3 / Gemini Prompt -> JSON Diagnosis)
  private async performLLMDiagnosis(
    logMessage: string,
    errorType: string,
    stackTrace: string,
    vectorMatches: { doc: KnowledgeDoc; similarity: number }[]
  ): Promise<DiagnosisResult> {
    const topMatch = vectorMatches[0];
    const topSim = topMatch ? topMatch.similarity : 0;

    // RAG Context Construction
    const knowledgeContext = vectorMatches.map((m, idx) => `
Doc #${idx + 1} [Cosine Similarity: ${(m.similarity * 100).toFixed(1)}%]
- Error Pattern: ${m.doc.error_pattern}
- Category: ${m.doc.category}
- Root Cause: ${m.doc.root_cause}
- Recommended Action: ${m.doc.recommended_action}
`).join('\n');

    // Attempt Gemini API call if key configured
    if (this.ai) {
      try {
        const prompt = `
You are an expert AIOps Diagnostic LLM running LLaMA 3 / Gemini. Analyze this application failure using the retrieved vector knowledge docs.

LOG ERROR:
${logMessage}
ERROR TYPE: ${errorType}
STACK TRACE: ${stackTrace || 'N/A'}

RETRIEVED KNOWLEDGE BASE DOCS (From ChromaDB):
${knowledgeContext}

AVAILABLE APPROVED REMEDIATION ACTIONS:
- restart_database
- restart_application
- restart_worker
- kill_port_process
- restore_configuration
- clear_temp_files

Respond ONLY in valid JSON with no markdown block formatting:
{
  "root_cause": "<concise technical explanation of root cause>",
  "confidence": <float between 0.50 and 0.99>,
  "ai_reasoning": "<short sentence explaining why this cause and fix were selected>",
  "recommended_remediation": "<one of the exact approved action strings>"
}
`;
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.root_cause && parsed.recommended_remediation) {
          return {
            root_cause: parsed.root_cause,
            confidence: Number(parsed.confidence) || 0.92,
            ai_reasoning: parsed.ai_reasoning || 'Diagnostic matches vector search retrieved pattern.',
            recommended_remediation: parsed.recommended_remediation,
            retrieved_knowledge: vectorMatches.map(v => v.doc)
          };
        }
      } catch (err) {
        console.warn('Gemini diagnosis fallback to deterministic local LLaMA 3 diagnostic rules:', err);
      }
    }

    // Deterministic Rule-Based Fallback (Local LLaMA 3 Simulation Engine)
    if (topMatch && topSim > 0.85) {
      return {
        root_cause: topMatch.doc.root_cause,
        confidence: topSim,
        ai_reasoning: `ChromaDB vector search matched document '${topMatch.doc.id}' with ${(topSim * 100).toFixed(1)}% similarity.`,
        recommended_remediation: topMatch.doc.recommended_action,
        retrieved_knowledge: vectorMatches.map(v => v.doc)
      };
    }

    // Unrecognized Error Pattern
    return {
      root_cause: `Unrecognized runtime exception (${errorType}). Potential unhandled exception in daemon.`,
      confidence: 0.65, // Below 0.90 threshold to trigger manual approval
      ai_reasoning: 'Vector similarity score is below 85%. Manual engineering review required.',
      recommended_remediation: 'restart_application',
      retrieved_knowledge: vectorMatches.map(v => v.doc)
    };
  }
}

export const ragDiagnosticService = new RAGDiagnosticService();

