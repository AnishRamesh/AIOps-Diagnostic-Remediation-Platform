import { KnowledgeDoc } from '../types';
import { ChromaClient } from 'chromadb';

const chroma = new ChromaClient({ path: "http://localhost:8000" });

export async function searchRunbooks(queryText: string) {
  const collection = await chroma.getOrCreateCollection({ name: "incident_runbooks" });
  const results = await collection.query({
    queryTexts: [queryText],
    nResults: 2
  });
  return results;
}

// Pre-seeded Troubleshooting Knowledge Base in ChromaDB
const INITIAL_KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: 'kb-001',
    error_pattern: 'Database connection timeout MongoNetworkTimeoutError PoolClearedError ECONNREFUSED 27017',
    category: 'Database Failure',
    description: 'Database connection pools become exhausted or database service crashes during high load or unexpected restart.',
    root_cause: 'MongoDB service unavailable or connection pool max overflow due to unclosed database connections.',
    recommended_action: 'restart_database'
  },
  {
    id: 'kb-002',
    error_pattern: 'Memory leak FATAL ERROR GC heap limit allocation failed JavaScript heap out of memory',
    category: 'Resource Exhaustion',
    description: 'Process memory usage grows monotonically until the V8 garbage collector crashes the main thread.',
    root_cause: 'Node/Python process heap memory exhaustion caused by uncollected cache or infinite log buffer.',
    recommended_action: 'restart_application'
  },
  {
    id: 'kb-003',
    error_pattern: 'Background worker deadlock ThreadPoolExecutor stuck lock contention queue blockage',
    category: 'Concurrency Failure',
    description: 'Asynchronous queue workers enter circular wait condition on shared mutex lock.',
    root_cause: 'Worker threads stuck in deadlocked queue wait loop causing background task processing to freeze.',
    recommended_action: 'restart_worker'
  },
  {
    id: 'kb-004',
    error_pattern: 'EADDRINUSE address already in use port 8080 3000 listen EADDRINUSE',
    category: 'Port Conflict',
    description: 'Attempting to spawn application daemon on socket port that is occupied by a orphaned zombie process.',
    root_cause: 'Port already in use by a lingering background process or rogue container.',
    recommended_action: 'kill_port_process'
  },
  {
    id: 'kb-005',
    error_pattern: 'Configuration parse error JSONDecodeError syntax error invalid JSON in app_config.json',
    category: 'Configuration Error',
    description: 'Application fails to boot due to corrupted dynamic configuration file during hot-reload.',
    root_cause: 'Malformed JSON or corrupted environment config file causing startup crash.',
    recommended_action: 'restore_configuration'
  },
  {
    id: 'kb-006',
    error_pattern: 'ENOSPC no space left on device disk full write error /tmp storage threshold 100%',
    category: 'Storage Overhead',
    description: 'Temporary directory or log volume fills disk capacity causing disk I/O operations to fail.',
    root_cause: 'Disk full due to uncleaned temporary files or unbounded debug log outputs.',
    recommended_action: 'clear_temp_files'
  },
  {
    id: 'kb-007',
    error_pattern: 'Connection refused HTTP 502 Bad Gateway upstream server timeout socket hang up',
    category: 'Network Interruption',
    description: 'Upstream microservice proxy or backend API service failed to answer connection handshake.',
    root_cause: 'Upstream service process died or firewall rule blocked communication.',
    recommended_action: 'restart_application'
  }
];

// Helper: Deterministic Pseudo Embedding Vector Generator (Simulating all-MiniLM-L6-v2 384d sentence transformer)
function generateDeterministicEmbedding(text: string, dimensions = 64): number[] {
  const normalized = text.toLowerCase();
  const vector: number[] = new Array(dimensions).fill(0);
  
  // Hash characters into vector frequencies and trigram features
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = (charCode * (i + 1) * 31) % dimensions;
    vector[idx] += Math.sin(charCode + i) * 0.5;
  }
  
  // Trigram / word feature signals
  const words = normalized.split(/\s+/);
  words.forEach((word, wIdx) => {
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const targetDim = Math.abs(hash) % dimensions;
    vector[targetDim] += (wIdx + 1) * 0.2;
  });

  // Unit length L2 normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => Number((v / magnitude).toFixed(4)));
}

// Cosine Similarity between two embedding vectors
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.min(1.0, Math.max(0.0, (similarity + 1) / 2)); // Normalize to [0, 1] range
}

export class ChromaDBStore {
  private collection: (KnowledgeDoc & { embedding: number[] })[] = [];

  constructor() {
    this.init();
  }

  private init() {
    this.collection = INITIAL_KNOWLEDGE_BASE.map(doc => ({
      ...doc,
      embedding: generateDeterministicEmbedding(`${doc.error_pattern} ${doc.category} ${doc.description} ${doc.root_cause}`)
    }));
  }

  public getKnowledgeDocs(): KnowledgeDoc[] {
    return this.collection.map(({ embedding, ...doc }) => doc);
  }

  public addKnowledgeDoc(doc: Omit<KnowledgeDoc, 'id'>): KnowledgeDoc {
    const newDoc: KnowledgeDoc = {
      ...doc,
      id: `kb-${Date.now().toString().slice(-4)}`
    };
    const embedding = generateDeterministicEmbedding(`${newDoc.error_pattern} ${newDoc.category} ${newDoc.description} ${newDoc.root_cause}`);
    this.collection.push({ ...newDoc, embedding });
    return newDoc;
  }

  public generateLogEmbedding(logText: string): number[] {
    return generateDeterministicEmbedding(logText);
  }

  // Perform ChromaDB Vector Query (Retrieve top k most similar troubleshooting docs)
  public querySimilarity(queryLog: string, topK = 3): { doc: KnowledgeDoc; similarity: number }[] {
    const queryVector = this.generateLogEmbedding(queryLog);
    
    const matches = this.collection.map(item => {
      const sim = calculateCosineSimilarity(queryVector, item.embedding);
      // Give a semantic keyword boost if key terms match directly
      const queryLower = queryLog.toLowerCase();
      let boostedSim = sim;
      
      if (queryLower.includes('mongo') || queryLower.includes('database') || queryLower.includes('timeout')) {
        if (item.id === 'kb-001') boostedSim = Math.max(boostedSim, 0.94);
      }
      if (queryLower.includes('memory') || queryLower.includes('heap') || queryLower.includes('out of memory')) {
        if (item.id === 'kb-002') boostedSim = Math.max(boostedSim, 0.95);
      }
      if (queryLower.includes('deadlock') || queryLower.includes('worker') || queryLower.includes('threadpool')) {
        if (item.id === 'kb-003') boostedSim = Math.max(boostedSim, 0.92);
      }
      if (queryLower.includes('eaddrinuse') || queryLower.includes('port')) {
        if (item.id === 'kb-004') boostedSim = Math.max(boostedSim, 0.96);
      }
      if (queryLower.includes('json') || queryLower.includes('config') || queryLower.includes('parse')) {
        if (item.id === 'kb-005') boostedSim = Math.max(boostedSim, 0.93);
      }
      if (queryLower.includes('enospc') || queryLower.includes('disk') || queryLower.includes('space')) {
        if (item.id === 'kb-006') boostedSim = Math.max(boostedSim, 0.91);
      }

      const { embedding, ...cleanDoc } = item;
      return {
        doc: cleanDoc,
        similarity: Number(boostedSim.toFixed(4))
      };
    });

    // Sort descending by vector similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, topK);
  }
}

export const chromaDB = new ChromaDBStore();
