import React, { useState, useEffect, useRef } from 'react';
import { FailureScenario, Incident, TimelineEvent } from '../types';
import { api } from '../services/api';
import { Terminal, Play, CheckCircle2, AlertTriangle, ArrowRight, Zap, RefreshCw, Cpu, Database, Radio, Pause, Sparkles } from 'lucide-react';
import { IncidentTimeline } from '../components/IncidentTimeline';

interface FailureSimulatorProps {
  onIncidentCreated: (inc: Incident) => void;
  onSelectIncident: (id: string) => void;
}

interface SSELogItem {
  timestamp: string;
  type: string;
  message: string;
}

export const FailureSimulator: React.FC<FailureSimulatorProps> = ({
  onIncidentCreated,
  onSelectIncident
}) => {
  const [scenarios, setScenarios] = useState<FailureScenario[]>([]);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('sc-1');
  
  // Custom scenario fields
  const [customAppName, setCustomAppName] = useState<string>('PaymentGateway-Service');
  const [customErrorType, setCustomErrorType] = useState<string>('ConnectionTimeoutException');
  const [customSeverity, setCustomSeverity] = useState<Incident['severity']>('HIGH');
  const [customLog, setCustomLog] = useState<string>(
    '2026-08-10 06:30:15 [FATAL] [PaymentGateway-Service] Connection pool exhausted. Timeout after 30000ms attempting to acquire PostgreSQL lock on DB payments_prod.'
  );
  const [customStackTrace, setCustomStackTrace] = useState<string>(
    'at Pool.acquireConnection (/app/db/pool.js:142)\nat async processPayment (/app/services/payment.js:88)'
  );

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<Incident | null>(null);

  // Real-Time Live Streaming & Continuous Injector State
  const [liveStreamLogs, setLiveStreamLogs] = useState<SSELogItem[]>([]);
  const [liveTimelineSteps, setLiveTimelineSteps] = useState<TimelineEvent[]>([]);
  const [isContinuousInjectorActive, setIsContinuousInjectorActive] = useState<boolean>(false);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getFailureScenarios().then(setScenarios).catch(console.error);

    // Subscribe to backend Real-Time SSE Stream
    const unsubscribe = api.subscribeToSSE((event) => {
      setSseConnected(true);
      const time = new Date(event.timestamp || Date.now()).toLocaleTimeString();

      if (event.type === 'connected') {
        setLiveStreamLogs(prev => [...prev.slice(-40), { timestamp: time, type: 'SYS', message: event.data?.message || 'SSE Stream Connected' }]);
      } else if (event.type === 'log_ingested') {
        setLiveStreamLogs(prev => [...prev.slice(-40), {
          timestamp: time,
          type: 'INGEST',
          message: `[ERROR INJECTED] ${event.data.error_type}: ${event.data.log_message}`
        }]);
      } else if (event.type === 'pipeline_step') {
        const step = event.data.step as TimelineEvent;
        if (step) {
          setLiveTimelineSteps(prev => {
            const exists = prev.some(s => s.id === step.id);
            if (exists) return prev;
            return [...prev, step];
          });
          setLiveStreamLogs(prev => [...prev.slice(-40), {
            timestamp: time,
            type: step.phase,
            message: `${step.title} -> ${step.description}`
          }]);
        }
      } else if (event.type === 'incident_created') {
        onIncidentCreated(event.data);
      } else if (event.type === 'incident_updated') {
        setActiveResult(event.data);
        onIncidentCreated(event.data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-scroll terminal log
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveStreamLogs, liveTimelineSteps]);

  // Continuous Auto-Fault Injector timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isContinuousInjectorActive && scenarios.length > 0) {
      timer = setInterval(() => {
        if (!isSimulating) {
          const randomIndex = Math.floor(Math.random() * scenarios.length);
          const randomScenario = scenarios[randomIndex];
          if (randomScenario) {
            handleRunSimulation(randomScenario.id);
          }
        }
      }, 12000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isContinuousInjectorActive, scenarios, isSimulating]);

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  const handleApplyPresetTemplate = (type: string) => {
    if (type === 'db_pool') {
      setCustomAppName('OrderProcessing-Service');
      setCustomErrorType('ConnectionTimeoutException');
      setCustomSeverity('CRITICAL');
      setCustomLog('2026-08-10 [FATAL] Database connection pool exhausted. 0/50 idle connections available after 30000ms timeout.');
      setCustomStackTrace('at Pool.getConnection (/app/node_modules/pg-pool/index.js:45)\nat async CheckoutController.checkout (/app/controllers/checkout.js:102)');
    } else if (type === 'port_conflict') {
      setCustomAppName('AuthService');
      setCustomErrorType('PortInUseError');
      setCustomSeverity('HIGH');
      setCustomLog('2026-08-10 [ERROR] Error: listen EADDRINUSE: address already in use :::8080. Process PID 9412 hanging.');
      setCustomStackTrace('at Server.setupListenHandle [as _listen2] (node:net:1463:16)\nat listenInCluster (node:net:1511:12)');
    } else if (type === 'oom') {
      setCustomAppName('Analytics-Worker');
      setCustomErrorType('OutOfMemoryError');
      setCustomSeverity('HIGH');
      setCustomLog('2026-08-10 [CRITICAL] FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory in background worker process.');
      setCustomStackTrace('at Worker.processBatchJob (/app/workers/analytics.js:210)\nat processTicksAndRejections (node:internal/process/task_queues:95:5)');
    } else if (type === 'corrupted_config') {
      setCustomAppName('Frontend-Proxy');
      setCustomErrorType('ConfigurationCorruptedError');
      setCustomSeverity('HIGH');
      setCustomLog('2026-08-10 [ERROR] Failed to parse /etc/nginx/conf.d/app.conf: YAMLSyntaxError: unexpected token on line 42.');
      setCustomStackTrace('at ConfigLoader.loadYaml (/app/config/loader.js:33)\nat async main (/app/server.js:12)');
    } else if (type === 'redis_down') {
      setCustomAppName('SessionStore');
      setCustomErrorType('RedisConnectionError');
      setCustomSeverity('MEDIUM');
      setCustomLog('2026-08-10 [WARN] Redis client failed to connect to 127.0.0.1:6379 - ECONNREFUSED');
      setCustomStackTrace('at RedisClient.connect (/app/node_modules/redis/index.js:88)');
    }
  };

  const handleRunSimulation = async (scenarioId?: string) => {
    setIsSimulating(true);
    setLiveTimelineSteps([]);

    try {
      let payload: any = {};
      if (scenarioId) {
        payload = { scenario_id: scenarioId };
      } else if (activeTab === 'preset' && selectedScenarioId) {
        payload = { scenario_id: selectedScenarioId };
      } else {
        payload = {
          app_name: customAppName || 'PaymentGateway-Service',
          error_type: customErrorType || 'CustomException',
          severity: customSeverity,
          log_message: customLog || '2026-08-10 [ERROR] Custom application failure injected',
          stack_trace: customStackTrace
        };
      }

      const result = await api.simulateFailure(payload);
      setActiveResult(result);
      onIncidentCreated(result);
    } catch (err) {
      console.error('Simulation execution failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">Real-Time Failure Scenario Injection Lab</h1>
              <span className="flex items-center space-x-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>SSE LIVE STREAM ACTIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject preset or custom application faults in real time &rarr; 384d Vector Embedding &rarr; ChromaDB RAG &rarr; LLaMA 3 Diagnosis &rarr; Allowlist Script Execution.
            </p>
          </div>
        </div>

        {/* Continuous Fault Generator Toggle */}
        <button
          onClick={() => setIsContinuousInjectorActive(!isContinuousInjectorActive)}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 border transition-all cursor-pointer ${
            isContinuousInjectorActive
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isContinuousInjectorActive ? (
            <>
              <Pause className="w-3.5 h-3.5 text-rose-400" />
              <span>Auto-Fault Injector [ACTIVE]</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Enable Real-Time Traffic & Faults</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Scenario Selection vs Live Pipeline Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Preset vs Custom Injector */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tabs: Preset Scenarios vs Custom Console */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'preset'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Preset Scenarios</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-rose-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Custom Injector</span>
            </button>
          </div>

          {/* TAB 1: Preset Scenarios List */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {scenarios.map((sc) => {
                  const isSelected = selectedScenarioId === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setSelectedScenarioId(sc.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-sky-500/80 shadow-md ring-1 ring-sky-500/50'
                          : 'bg-[#1E293B] text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white">{sc.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          sc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {sc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                        {sc.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <code className="text-sky-400">
                          Fix: {sc.expected_action}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScenarioId(sc.id);
                            handleRunSimulation(sc.id);
                          }}
                          disabled={isSimulating}
                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Inject Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trigger Selected Button */}
              {selectedScenario && (
                <button
                  onClick={() => handleRunSimulation(selectedScenario.id)}
                  disabled={isSimulating}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer font-mono"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Streaming Real-Time Diagnostic Steps...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Run Preset ({selectedScenario.title})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: Custom Failure Scenario Injector Console */}
          {activeTab === 'custom' && (
            <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-rose-400" />
                  <span>Custom Failure Payload Console</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Customer Direct Injection</span>
              </div>

              {/* Quick Starter Templates */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-semibold">
                  Quick Starter Templates
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleApplyPresetTemplate('db_pool')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                  >
                    ⚡ DB Pool Timeout
                  </button>
                  <button
                    onClick={() => handleApplyPresetTemplate('port_conflict')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                  >
                    ⚡ Port 8080 Conflict
                  </button>
                  <button
                    onClick={() => handleApplyPresetTemplate('oom')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                  >
                    ⚡ OOM Memory Leak
                  </button>
                  <button
                    onClick={() => handleApplyPresetTemplate('corrupted_config')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                  >
                    ⚡ Corrupted Config
                  </button>
                  <button
                    onClick={() => handleApplyPresetTemplate('redis_down')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                  >
                    ⚡ Redis Offline
                  </button>
                </div>
              </div>

              {/* App Name & Error Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Microservice / App Name</label>
                  <input
                    type="text"
                    value={customAppName}
                    onChange={(e) => setCustomAppName(e.target.value)}
                    placeholder="e.g. PaymentGateway"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Error Exception Class</label>
                  <input
                    type="text"
                    value={customErrorType}
                    onChange={(e) => setCustomErrorType(e.target.value)}
                    placeholder="e.g. ConnectionTimeoutException"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Severity Level</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Incident['severity'][]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setCustomSeverity(sev)}
                      className={`py-1 rounded font-mono text-[10px] font-bold border cursor-pointer ${
                        customSeverity === sev
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log Message */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Log Error Message</label>
                <textarea
                  rows={3}
                  value={customLog}
                  onChange={(e) => setCustomLog(e.target.value)}
                  placeholder="Paste or write custom error log output here..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sky-300 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Stack Trace */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Stack Trace (Optional)</label>
                <textarea
                  rows={2}
                  value={customStackTrace}
                  onChange={(e) => setCustomStackTrace(e.target.value)}
                  placeholder="Paste optional stack trace..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-400 font-mono text-[10px] leading-relaxed focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Inject Custom Button */}
              <button
                onClick={() => handleRunSimulation()}
                disabled={isSimulating || !customLog.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer font-mono"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Streaming Custom Failure Diagnostics...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Inject Custom Failure & Auto-Resolve</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Real-Time SSE Event Log Terminal */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[10px] text-slate-300 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
              <span className="flex items-center space-x-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Live Event Stream Log (/api/stream)</span>
              </span>
              <span className="text-[9px] text-emerald-400">SSE ACTIVE</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono">
              {liveStreamLogs.length === 0 && (
                <div className="text-slate-600 italic">Waiting for real-time failure events...</div>
              )}
              {liveStreamLogs.map((log, i) => (
                <div key={i} className="flex items-start space-x-2 text-[10px] leading-tight">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className="text-sky-400 font-bold shrink-0">[{log.type}]</span>
                  <span className="text-slate-300 truncate">{log.message}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

        {/* Right Column: Live Pipeline Diagnostics Output */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Real-Time AIOps Pipeline Output</span>
            {isSimulating && <span className="text-sky-400 font-normal animate-pulse">Processing live steps...</span>}
          </h2>

          {/* Live Step-by-Step Animation Feed */}
          {isSimulating && liveTimelineSteps.length > 0 && (
            <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-sky-300 border-b border-slate-800 pb-2">
                <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                <span>Streaming Real-Time Diagnosis ({liveTimelineSteps.length}/6 Steps)</span>
              </div>
              <IncidentTimeline timeline={liveTimelineSteps} />
            </div>
          )}

          {isSimulating && liveTimelineSteps.length === 0 && (
            <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-8 text-center text-white space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
              <h3 className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">Connecting to Real-Time SSE Stream</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto font-mono text-[11px]">
                Log Ingestion &rarr; 384d Embedding &rarr; ChromaDB Search &rarr; RAG LLaMA 3 &rarr; Allowlist Check &rarr; Auto-Remediation...
              </p>
            </div>
          )}

          {!isSimulating && !activeResult && (
            <div className="bg-[#1E293B] rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">No Active Simulation Executing</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click "Inject Now" or toggle "Enable Real-Time Traffic & Faults" to watch the AIOps platform auto-heal live.
              </p>
            </div>
          )}

          {!isSimulating && activeResult && (
            <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 space-y-4 text-slate-200">
              
              {/* Diagnosis Summary Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs font-bold text-sky-400">{activeResult.incident_id}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      MTTR: {activeResult.resolution_time_seconds || 12}s
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      AI Confidence: {(activeResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{activeResult.root_cause}</h3>
                  <p className="text-xs text-slate-400 mt-1">{activeResult.ai_reasoning}</p>
                </div>

                <button
                  onClick={() => onSelectIncident(activeResult.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <span>Full View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step-by-Step Live Timeline */}
              <div>
                <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Execution Timeline
                </h4>
                <IncidentTimeline timeline={activeResult.timeline} />
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

