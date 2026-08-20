import React, { useState, useEffect } from 'react';
import { Incident, SystemStatus, User } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { VivaGuideModal } from './components/VivaGuideModal';

import { Dashboard } from './pages/Dashboard';
import { FailureSimulator } from './pages/FailureSimulator';
import { Incidents } from './pages/Incidents';
import { IncidentDetails } from './pages/IncidentDetails';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Analytics } from './pages/Analytics';
import { Allowlist } from './pages/Allowlist';
import { Audit } from './pages/Audit';
import { Settings } from './pages/Settings';
import { AuthLoginPage } from './pages/AuthLoginPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isVivaModalOpen, setIsVivaModalOpen] = useState<boolean>(false);

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadData = () => {
    api.getSystemStatus().then(setStatus).catch(console.error);
    api.getIncidents().then(setIncidents).catch(console.error);
    api.getAuthUser().then(setCurrentUser).catch(console.error);
  };

  useEffect(() => {
    loadData();

    // Subscribe to backend SSE Real-Time Event Stream
    const unsubscribe = api.subscribeToSSE((event) => {
      if (event.type === 'incident_created' || event.type === 'incident_updated' || event.type === 'audit_log') {
        loadData();
      }
    });

    const interval = setInterval(loadData, 5000); // Polling backup
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
  };

  const handleExecuteRemediation = async (incidentId: string) => {
    try {
      await api.executeRemediation(incidentId);
      loadData();
    } catch (err) {
      console.error('Failed executing manual remediation:', err);
    }
  };

  const handleIncidentCreated = (newIncident: Incident) => {
    loadData();
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
  };

  // If user is unauthenticated, show a separate dedicated Full-Screen Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-200">
        <div className="w-full max-w-5xl">
          <AuthLoginPage
            currentUser={null}
            onUserLogin={(u) => {
              setCurrentUser(u);
              setActiveTab('dashboard');
            }}
            onUserLogout={() => {
              setCurrentUser(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col font-sans antialiased text-slate-200">
      
      {/* Top Header */}
      <Navbar
        currentUser={currentUser}
        onOpenVivaModal={() => setIsVivaModalOpen(true)}
        onNavigateToSimulator={() => {
          setSelectedIncidentId(null);
          setActiveTab('simulator');
        }}
        onNavigateToAuth={() => {
          setSelectedIncidentId(null);
          setActiveTab('auth');
        }}
        onSignOut={handleSignOut}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedIncidentId(null);
            setActiveTab(tab);
          }}
          openVivaGuide={() => setIsVivaModalOpen(true)}
          currentUserRole={currentUser?.role}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {selectedIncidentId ? (
            <IncidentDetails
              incidentId={selectedIncidentId}
              onBack={() => setSelectedIncidentId(null)}
              onExecuteRemediation={handleExecuteRemediation}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  status={status}
                  incidents={incidents}
                  onSelectIncident={handleSelectIncident}
                  onNavigateToSimulator={() => setActiveTab('simulator')}
                  onExecuteRemediation={handleExecuteRemediation}
                />
              )}

              {activeTab === 'simulator' && (
                <FailureSimulator
                  onIncidentCreated={handleIncidentCreated}
                  onSelectIncident={handleSelectIncident}
                />
              )}

              {activeTab === 'auth' && (
                <AuthLoginPage
                  currentUser={currentUser}
                  onUserLogin={(u) => {
                    setCurrentUser(u);
                  }}
                  onUserLogout={() => {
                    setCurrentUser(null);
                  }}
                />
              )}

              {activeTab === 'incidents' && (
                <Incidents
                  incidents={incidents}
                  onSelectIncident={handleSelectIncident}
                  onExecuteRemediation={handleExecuteRemediation}
                />
              )}

              {activeTab === 'knowledge' && <KnowledgeBase />}

              {activeTab === 'analytics' && <Analytics status={status} incidents={incidents} />}

              {activeTab === 'allowlist' && <Allowlist />}

              {activeTab === 'audit' && <Audit />}

              {activeTab === 'settings' && <Settings />}
            </>
          )}

        </main>

      </div>

      {/* High Density System Status Footer */}
      <footer className="h-8 bg-[#111827] border-t border-slate-800 px-6 flex items-center justify-between text-[10px] text-slate-400 shrink-0 font-mono">
        <div>ENVIRONMENT: <span className="text-sky-400 font-semibold">PRODUCTION-CLUSTER-A</span></div>
        <div className="hidden sm:flex gap-4">
          <span>MongoDB: <span className="text-emerald-400 font-bold">CONNECTED</span></span>
          <span>ChromaDB: <span className="text-emerald-400 font-bold">SYNC OK</span></span>
          <span>Ollama Host: <span className="text-sky-400 font-bold">LOCALHOST:11434</span></span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SYSTEM ACTIVE</span>
        </div>
      </footer>

      {/* Viva & College Review Modal for Anish R */}
      <VivaGuideModal
        isOpen={isVivaModalOpen}
        onClose={() => setIsVivaModalOpen(false)}
      />

    </div>
  );
}
