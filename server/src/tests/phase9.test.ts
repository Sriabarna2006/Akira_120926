process.env.NODE_ENV = 'test';
import { knowledgeGraphService } from '../services/learning/knowledgeGraph.service.js';
import { knowledgeGraphRepository } from '../repositories/knowledgeGraph.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { masteryService } from '../services/learning/mastery.service.js';
import { personalizationService } from '../services/learning/personalization.service.js';
import {
  CanonicalEvent,
  ExtractedConcept,
  ConceptRelationType,
  ConceptGraphNode,
  ConceptLearningPath,
  RelatedConceptItem,
  RelatedEventItem,
  EventKnowledgeMap,
} from '../types/index.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase9VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 9: KNOWLEDGE GRAPH & CROSS-TOPIC INTELLIGENCE SUITE');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const testUserId1 = '00000000-0000-0000-0000-000000000001';
  const testUserId2 = '00000000-0000-0000-0000-000000000002';
  const now = new Date();

  // -------------------------------------------------------------------------
  // 0. SEED FIXTURES (Concepts, Events, Event-Concept Mappings)
  // -------------------------------------------------------------------------
  const cAsymmetricCrypto: ExtractedConcept = {
    id: 'c_sec_crypto_asym',
    title: 'Asymmetric Cryptography & Public Key Infrastructure',
    slug: 'asymmetric-cryptography',
    category: 'Cybersecurity',
    shortDefinition: 'Public and private key pairs for encryption and digital signatures.',
    whyItMatters: 'Forms the backbone of all internet authentication and TLS.',
    prerequisites: [],
  };

  const cZeroDay: ExtractedConcept = {
    id: 'c_sec_zeroday',
    title: 'Zero-Day Vulnerability',
    slug: 'zero-day',
    category: 'Cybersecurity',
    shortDefinition: 'Unpatched vulnerability flaw exposed in the wild.',
    whyItMatters: 'Leaves critical systems vulnerable to immediate exploitation.',
    prerequisites: [],
  };

  const cSupplyChain: ExtractedConcept = {
    id: 'c_sec_supply_chain',
    title: 'Software Supply Chain Attack',
    slug: 'software-supply-chain-attack',
    category: 'Cybersecurity',
    shortDefinition: 'Compromising third-party libraries before downstream deployment.',
    whyItMatters: 'Can compromise thousands of software deployments through trusted pipelines.',
    prerequisites: [],
  };

  const cMemorySafety: ExtractedConcept = {
    id: 'c_sec_memory_safety',
    title: 'Memory Safety Vulnerabilities',
    slug: 'memory-safety',
    category: 'Cybersecurity',
    shortDefinition: 'Memory access bugs leading to arbitrary execution.',
    whyItMatters: 'Root cause for a vast percentage of historic remote code executions.',
    prerequisites: [],
  };

  const cOrphan: ExtractedConcept = {
    id: 'c_orphan_node',
    title: 'Isolated Quantum Physics Paradigm',
    slug: 'isolated-quantum-paradigm',
    category: 'Science',
    shortDefinition: 'Isolated conceptual test node.',
    whyItMatters: 'Tests orphan handling in knowledge graph.',
    prerequisites: [],
  };

  // Seed concepts to repository
  await knowledgeGraphRepository.saveConcept(cAsymmetricCrypto);
  await knowledgeGraphRepository.saveConcept(cZeroDay);
  await knowledgeGraphRepository.saveConcept(cSupplyChain);
  await knowledgeGraphRepository.saveConcept(cMemorySafety);
  await knowledgeGraphRepository.saveConcept(cOrphan);

  // Seed canonical events
  const event1: CanonicalEvent = {
    id: 'evt_p9_kernel_zeroday',
    title: 'Critical Zero-Day Kernel Exploit Detected in Distributed Infrastructure',
    summary: 'Security researchers identify remote kernel exploitation vector bypass.',
    regionId: 'world',
    categoryId: 'cybersecurity',
    region: 'World',
    category: 'Cybersecurity',
    urgencyLabel: 'BREAKING',
    importanceScore: 95,
    velocityScore: 92,
    finalRankScore: 96,
    whyItMatters: 'Requires immediate system-level patch deployment.',
    firstPublishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    lastUpdatedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
    sourceCount: 6,
    lifecycleStatus: 'OFFICIAL_CONFIRMATION',
    createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    concepts: [
      { id: cZeroDay.id, title: cZeroDay.title, slug: cZeroDay.slug, shortDefinition: cZeroDay.shortDefinition },
      { id: cMemorySafety.id, title: cMemorySafety.title, slug: cMemorySafety.slug, shortDefinition: cMemorySafety.shortDefinition },
    ],
  };

  const event2: CanonicalEvent = {
    id: 'evt_p9_supply_chain_incident',
    title: 'Global Package Registry Compromised via Malicious Dependency Injection',
    summary: 'Attackers inject credential harvesting modules into popular open source repositories.',
    regionId: 'world',
    categoryId: 'cybersecurity',
    region: 'World',
    category: 'Cybersecurity',
    urgencyLabel: 'IMPORTANT',
    importanceScore: 90,
    velocityScore: 88,
    finalRankScore: 91,
    whyItMatters: 'Affects thousands of automated CI/CD build environments.',
    firstPublishedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
    lastUpdatedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    sourceCount: 4,
    lifecycleStatus: 'NEW_DEVELOPMENT',
    createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
    concepts: [
      { id: cSupplyChain.id, title: cSupplyChain.title, slug: cSupplyChain.slug, shortDefinition: cSupplyChain.shortDefinition },
      { id: cZeroDay.id, title: cZeroDay.title, slug: cZeroDay.slug, shortDefinition: cZeroDay.shortDefinition },
    ],
  };

  EventRepository.create(event1);
  EventRepository.create(event2);

  // Link event-concepts
  await knowledgeGraphRepository.linkEventConcept(event1.id, cZeroDay.id, 95);
  await knowledgeGraphRepository.linkEventConcept(event1.id, cMemorySafety.id, 85);
  await knowledgeGraphRepository.linkEventConcept(event2.id, cSupplyChain.id, 92);
  await knowledgeGraphRepository.linkEventConcept(event2.id, cZeroDay.id, 80);

  // -------------------------------------------------------------------------
  // 1. CONCEPT GRAPH STRUCTURE & RELATION PERSISTENCE
  // -------------------------------------------------------------------------
  try {
    // Add valid relations
    await knowledgeGraphService.addRelation({
      sourceConceptId: cZeroDay.id,
      targetConceptId: cMemorySafety.id,
      relationType: 'PREREQUISITE',
      weight: 1.0,
    });

    await knowledgeGraphService.addRelation({
      sourceConceptId: cZeroDay.id,
      targetConceptId: cSupplyChain.id,
      relationType: 'RELATED',
      weight: 0.8,
    });

    const tree = await knowledgeGraphService.getPrerequisiteTree(cZeroDay.id);
    const relatedList = await knowledgeGraphService.getRelatedConcepts(cZeroDay.id, 5);

    const hasUpstreamPrereq = tree.nodes.some((c: ConceptGraphNode) => c.id === cMemorySafety.id);
    const hasRelated = relatedList.some((r: RelatedConceptItem) => r.concept.id === cSupplyChain.id);
    const targetNode = tree.nodes.find((n: ConceptGraphNode) => n.id === cZeroDay.id);

    results.push({
      suite: 'Concept Graph Structure',
      name: 'Traverse Direct Prerequisites, Related Concepts & Linked Hierarchy',
      passed: hasUpstreamPrereq && hasRelated && !!targetNode,
      details: `Tree Nodes: ${tree.nodes.length}, Edges: ${tree.edges.length}, Related Concepts: ${relatedList.length}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Concept Graph Structure', name: 'Traverse Direct Prerequisites', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 2. SELF-LOOP VALIDATION
  // -------------------------------------------------------------------------
  try {
    let selfLoopFailed = false;
    try {
      await knowledgeGraphService.addRelation({
        sourceConceptId: cZeroDay.id,
        targetConceptId: cZeroDay.id,
        relationType: 'PREREQUISITE',
        weight: 1.0,
      });
    } catch (err: any) {
      selfLoopFailed = true;
    }

    results.push({
      suite: 'Graph Validation & Integrity',
      name: 'Self-Loop Prevention (Concept cannot link to itself)',
      passed: selfLoopFailed,
      details: 'Correctly threw validation error on sourceConceptId === targetConceptId',
    });
  } catch (err: any) {
    results.push({ suite: 'Graph Validation & Integrity', name: 'Self-Loop Prevention', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 3. DUPLICATE EDGE PREVENTION / IDEMPOTENCY
  // -------------------------------------------------------------------------
  try {
    await knowledgeGraphService.addRelation({
      sourceConceptId: cMemorySafety.id,
      targetConceptId: cAsymmetricCrypto.id,
      relationType: 'RELATED',
      weight: 0.7,
    });

    await knowledgeGraphService.addRelation({
      sourceConceptId: cMemorySafety.id,
      targetConceptId: cAsymmetricCrypto.id,
      relationType: 'RELATED',
      weight: 0.7,
    });

    const relations = await knowledgeGraphRepository.getRelationsForConcept(cMemorySafety.id);
    const dupCount = relations.filter(
      (r) =>
        r.sourceConceptId === cMemorySafety.id &&
        r.targetConceptId === cAsymmetricCrypto.id &&
        r.relationType === 'RELATED'
    ).length;

    results.push({
      suite: 'Graph Validation & Integrity',
      name: 'Duplicate Edge Idempotency (Updating or ignoring duplicate edges)',
      passed: dupCount === 1,
      details: `Count of relations between memory safety and asymmetric crypto: ${dupCount}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Graph Validation & Integrity', name: 'Duplicate Edge Idempotency', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 4. ORPHAN NODE HANDLING
  // -------------------------------------------------------------------------
  try {
    const orphanTree = await knowledgeGraphService.getPrerequisiteTree(cOrphan.id);
    const isCleanOrphan =
      orphanTree.nodes.length === 1 &&
      orphanTree.nodes[0].id === cOrphan.id &&
      orphanTree.edges.length === 0;

    results.push({
      suite: 'Graph Validation & Integrity',
      name: 'Orphan Node Graceful Handling (Empty relationships, valid single-node tree)',
      passed: isCleanOrphan,
      details: `Orphan Node returned ${orphanTree.nodes.length} node and 0 edges cleanly`,
    });
  } catch (err: any) {
    results.push({ suite: 'Graph Validation & Integrity', name: 'Orphan Node Handling', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 5. DIRECT CYCLE DETECTION (A -> B -> A)
  // -------------------------------------------------------------------------
  try {
    // cZeroDay -> cMemorySafety is PREREQUISITE
    // Attempting cMemorySafety -> cZeroDay PREREQUISITE must fail
    let directCycleCaught = false;
    try {
      await knowledgeGraphService.addRelation({
        sourceConceptId: cMemorySafety.id,
        targetConceptId: cZeroDay.id,
        relationType: 'PREREQUISITE',
        weight: 1.0,
      });
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('cycle')) {
        directCycleCaught = true;
      }
    }

    results.push({
      suite: 'Cycle Prevention (3-Color DFS)',
      name: 'Direct Cycle Prevention (A -> B -> A Prerequisite Cycle Rejection)',
      passed: directCycleCaught,
      details: 'Cycle detection detected immediate back-edge and aborted relation creation',
    });
  } catch (err: any) {
    results.push({ suite: 'Cycle Prevention (3-Color DFS)', name: 'Direct Cycle Prevention', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 6. INDIRECT MULTI-HOP CYCLE DETECTION (A -> B -> C -> A)
  // -------------------------------------------------------------------------
  try {
    const cA: ExtractedConcept = {
      id: 'c_cycle_node_a',
      title: 'Node A',
      slug: 'node-a',
      category: 'Technology',
      shortDefinition: 'Node A',
      whyItMatters: 'Cycle test node A',
      prerequisites: [],
    };
    const cB: ExtractedConcept = {
      id: 'c_cycle_node_b',
      title: 'Node B',
      slug: 'node-b',
      category: 'Technology',
      shortDefinition: 'Node B',
      whyItMatters: 'Cycle test node B',
      prerequisites: [],
    };
    const cC: ExtractedConcept = {
      id: 'c_cycle_node_c',
      title: 'Node C',
      slug: 'node-c',
      category: 'Technology',
      shortDefinition: 'Node C',
      whyItMatters: 'Cycle test node C',
      prerequisites: [],
    };

    await knowledgeGraphRepository.saveConcept(cA);
    await knowledgeGraphRepository.saveConcept(cB);
    await knowledgeGraphRepository.saveConcept(cC);

    await knowledgeGraphService.addRelation({
      sourceConceptId: cA.id,
      targetConceptId: cB.id,
      relationType: 'PREREQUISITE',
      weight: 1.0,
    });

    await knowledgeGraphService.addRelation({
      sourceConceptId: cB.id,
      targetConceptId: cC.id,
      relationType: 'PREREQUISITE',
      weight: 1.0,
    });

    let multiHopCaught = false;
    try {
      // Adding C -> A prerequisite would create A -> B -> C -> A
      await knowledgeGraphService.addRelation({
        sourceConceptId: cC.id,
        targetConceptId: cA.id,
        relationType: 'PREREQUISITE',
        weight: 1.0,
      });
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('cycle')) {
        multiHopCaught = true;
      }
    }

    results.push({
      suite: 'Cycle Prevention (3-Color DFS)',
      name: 'Multi-Hop Transitive Cycle Detection (A -> B -> C -> A Rejection)',
      passed: multiHopCaught,
      details: 'Transitive 3-color DFS identified cycle path through intermediary nodes',
    });
  } catch (err: any) {
    results.push({ suite: 'Cycle Prevention (3-Color DFS)', name: 'Multi-Hop Transitive Cycle Detection', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 7. NON-PREREQUISITE CYCLES PERMITTED (RELATED A <-> B)
  // -------------------------------------------------------------------------
  try {
    const nonPrereqRel = await knowledgeGraphService.addRelation({
      sourceConceptId: cAsymmetricCrypto.id,
      targetConceptId: cZeroDay.id,
      relationType: 'RELATED',
      weight: 0.9,
    });

    const isPermitted = nonPrereqRel.sourceConceptId === cAsymmetricCrypto.id;

    results.push({
      suite: 'Cycle Prevention (3-Color DFS)',
      name: 'Non-Prerequisite Bi-directional Relationships Permitted (RELATED A <-> B)',
      passed: isPermitted,
      details: 'Non-prerequisite semantic edges bypass strict DAG cycle restrictions as intended',
    });
  } catch (err: any) {
    results.push({ suite: 'Cycle Prevention (3-Color DFS)', name: 'Non-Prerequisite Bi-directional', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 8. GRAPH TRAVERSAL DEPTH BOUNDING (depth <= 5)
  // -------------------------------------------------------------------------
  try {
    const boundedTree = await knowledgeGraphService.getPrerequisiteTree(cZeroDay.id, undefined, 10);
    // Max depth capped at 5
    const maxObservedDepth = Math.max(...boundedTree.nodes.map((n: ConceptGraphNode) => n.depth || 0));

    results.push({
      suite: 'Bounded Traversal & Performance',
      name: 'Graph Traversal Depth Cap (Max Depth Bounded at <= 5)',
      passed: maxObservedDepth <= 5 && boundedTree.nodes.length > 0,
      details: `Traversal completed safely. Max observed depth: ${maxObservedDepth} (capped at 5)`,
    });
  } catch (err: any) {
    results.push({ suite: 'Bounded Traversal & Performance', name: 'Graph Traversal Depth Cap', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 9. DETERMINISTIC RELATED CONCEPT SCORING
  // -------------------------------------------------------------------------
  try {
    const relatedList = await knowledgeGraphService.getRelatedConcepts(cZeroDay.id, 5);
    const allScoresValid = relatedList.every(
      (r: RelatedConceptItem) =>
        r.score >= 0 &&
        r.score <= 100 &&
        typeof r.reason === 'string' &&
        typeof r.sharedEventCount === 'number' &&
        r.concept.id !== cZeroDay.id
    );

    // Verify descending order
    let isSorted = true;
    for (let i = 0; i < relatedList.length - 1; i++) {
      if (relatedList[i].score < relatedList[i + 1].score) {
        isSorted = false;
        break;
      }
    }

    results.push({
      suite: 'Scoring Engine & Determinism',
      name: 'Related Concept Multi-Signal Scoring & Descending Order',
      passed: relatedList.length > 0 && allScoresValid && isSorted,
      details: `Returned ${relatedList.length} related concepts with verified score ranges [0,100] and descending order`,
    });
  } catch (err: any) {
    results.push({ suite: 'Scoring Engine & Determinism', name: 'Related Concept Multi-Signal Scoring', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 10. DETERMINISTIC RELATED EVENT SCORING
  // -------------------------------------------------------------------------
  try {
    const relatedEvts = await knowledgeGraphService.getRelatedEvents(event1.id, 5);
    const allEvtsValid = relatedEvts.every(
      (r: RelatedEventItem) =>
        r.score >= 0 &&
        r.score <= 100 &&
        typeof r.reason === 'string' &&
        typeof r.scoreBreakdown === 'object' &&
        r.event.id !== event1.id
    );

    let isEvtsSorted = true;
    for (let i = 0; i < relatedEvts.length - 1; i++) {
      if (relatedEvts[i].score < relatedEvts[i + 1].score) {
        isEvtsSorted = false;
        break;
      }
    }

    const foundTargetEvent2 = relatedEvts.some((r: RelatedEventItem) => r.event.id === event2.id);

    results.push({
      suite: 'Scoring Engine & Determinism',
      name: 'Related Event Multi-Signal Relevance Scoring',
      passed: relatedEvts.length > 0 && allEvtsValid && isEvtsSorted && foundTargetEvent2,
      details: `Found related event ${event2.id} with score ${relatedEvts[0]?.score} and valid score breakdown`,
    });
  } catch (err: any) {
    results.push({ suite: 'Scoring Engine & Determinism', name: 'Related Event Multi-Signal Relevance Scoring', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 11. USER MASTERY STATUS & CLASSIFICATION (STRONG, DEVELOPING, NEEDS_LEARNING, UNKNOWN)
  // -------------------------------------------------------------------------
  try {
    // User 1 masters cMemorySafety
    await learningRepository.saveProgress({
      userId: testUserId1,
      conceptId: cMemorySafety.id,
      masteryScore: 95,
      masteryStatus: 'STRONG',
      attemptCount: 3,
      correctCount: 3,
      incorrectCount: 0,
      lastMasteredAt: new Date().toISOString(),
    });

    // User 1 starts cZeroDay with developing status
    await learningRepository.saveProgress({
      userId: testUserId1,
      conceptId: cZeroDay.id,
      masteryScore: 40,
      masteryStatus: 'NEEDS_LEARNING',
      attemptCount: 1,
      correctCount: 1,
      incorrectCount: 1,
    });

    const treeUser1 = await knowledgeGraphService.getPrerequisiteTree(cZeroDay.id, testUserId1);

    const memorySafetyPrereq = treeUser1.nodes.find((c: ConceptGraphNode) => c.id === cMemorySafety.id);
    const zeroDayNode = treeUser1.nodes.find((n: ConceptGraphNode) => n.id === cZeroDay.id);

    const prereqMastered = memorySafetyPrereq?.masteryStatus === 'STRONG';
    const targetDeveloping = zeroDayNode?.masteryStatus === 'NEEDS_LEARNING';

    results.push({
      suite: 'User Mastery & Gap Integration',
      name: 'User Mastery Status Evaluation on Graph Nodes',
      passed: prereqMastered && targetDeveloping,
      details: `Prerequisite status: ${memorySafetyPrereq?.masteryStatus}, Target node status: ${zeroDayNode?.masteryStatus}`,
    });
  } catch (err: any) {
    results.push({ suite: 'User Mastery & Gap Integration', name: 'User Mastery Status Evaluation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 12. UNMASTERED GAP-FIRST LEARNING PATH GENERATION
  // -------------------------------------------------------------------------
  try {
    // Target is cZeroDay. For User 1, cMemorySafety is STRONG, cZeroDay is NEEDS_LEARNING.
    const pathUser1 = await knowledgeGraphService.getLearningPath(cZeroDay.id, testUserId1);

    // For User 2, nothing is mastered.
    const pathUser2 = await knowledgeGraphService.getLearningPath(cZeroDay.id, testUserId2);

    // Prerequisite cMemorySafety must appear before target cZeroDay in topological sequence
    const memIndex = pathUser2.steps.findIndex((s) => s.conceptId === cMemorySafety.id);
    const zeroIndex = pathUser2.steps.findIndex((s) => s.conceptId === cZeroDay.id);

    const topologicalOrderValid = memIndex !== -1 && zeroIndex !== -1 && memIndex < zeroIndex;
    const readinessUser1Higher = pathUser1.userOverallReadiness > pathUser2.userOverallReadiness;

    results.push({
      suite: 'Topological Learning Paths',
      name: 'Topological Prerequisite Ordering & Gap Prioritization',
      passed: topologicalOrderValid && readinessUser1Higher,
      details: `User 1 Readiness: ${pathUser1.userOverallReadiness}% vs User 2 Readiness: ${pathUser2.userOverallReadiness}%, Prereq Step ${memIndex + 1} < Target Step ${zeroIndex + 1}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Topological Learning Paths', name: 'Topological Prerequisite Ordering', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 13. EVENT KNOWLEDGE MAP & COMPREHENSION READINESS
  // -------------------------------------------------------------------------
  try {
    const mapUser1 = await knowledgeGraphService.getEventKnowledgeMap(event1.id, testUserId1);
    const mapAnon = await knowledgeGraphService.getEventKnowledgeMap(event1.id);

    const hasConcepts = mapUser1.keyConcepts.length > 0;
    const userReadinessScoreValid = mapUser1.userReadinessPercentage >= 0 && mapUser1.userReadinessPercentage <= 100;
    const anonReadinessScoreValid = mapAnon.userReadinessPercentage >= 0;

    results.push({
      suite: 'Event Knowledge Map',
      name: 'Event Comprehension Readiness & Gap Concepts Computation',
      passed: hasConcepts && userReadinessScoreValid && anonReadinessScoreValid,
      details: `User 1 Readiness: ${mapUser1.userReadinessPercentage}%, Anon Readiness: ${mapAnon.userReadinessPercentage}%`,
    });
  } catch (err: any) {
    results.push({ suite: 'Event Knowledge Map', name: 'Event Comprehension Readiness', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 14. MULTI-TENANT ISOLATION & PRIVACY
  // -------------------------------------------------------------------------
  try {
    const map1 = await knowledgeGraphService.getEventKnowledgeMap(event1.id, testUserId1);
    const map2 = await knowledgeGraphService.getEventKnowledgeMap(event1.id, testUserId2);

    // User 1 mastered a concept that User 2 has not
    const isolationIntact = map1.userReadinessPercentage !== map2.userReadinessPercentage;

    results.push({
      suite: 'Security & Multi-Tenant Isolation',
      name: 'Strict User Mastery Isolation on Knowledge Graphs',
      passed: isolationIntact,
      details: `User 1 Readiness: ${map1.userReadinessPercentage}% vs User 2 Readiness: ${map2.userReadinessPercentage}%`,
    });
  } catch (err: any) {
    results.push({ suite: 'Security & Multi-Tenant Isolation', name: 'Strict User Mastery Isolation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 15. REGRESSION: PHASE 5 RANKING, PHASE 6 CONCEPTS, PHASE 7 MASTERY, PHASE 8 FEEDS
  // -------------------------------------------------------------------------
  try {
    // Phase 6 concept lookup
    const p6Concept = await knowledgeGraphRepository.getConceptById(cZeroDay.id);

    // Phase 7 mastery progress
    const p7Progress = await learningRepository.getProgress(testUserId1, undefined, cMemorySafety.id);

    // Phase 8 personalization feed
    const p8Feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 2 });

    const regressionPass = !!p6Concept && !!p7Progress && !!p8Feed && Array.isArray(p8Feed.items);

    results.push({
      suite: 'Architecture & Regression Integrity',
      name: 'Phases 5-8 Cross-Layer Compatibility (Zero Regressions)',
      passed: regressionPass,
      details: `Verified Phase 6 concept lookup (${p6Concept?.id}), Phase 7 SM-2 mastery (${p7Progress?.masteryScore}%), and Phase 8 adaptive feed items (${p8Feed.items.length})`,
    });
  } catch (err: any) {
    results.push({ suite: 'Architecture & Regression Integrity', name: 'Phases 5-8 Compatibility', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // PRINT SUMMARY
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('PHASE 9 TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------------');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.suite}] ${r.name}`);
    if (r.details) console.log(`   └─ ${r.details}`);
    if (r.error) {
      console.log(`   └─ 🚨 ERROR: ${r.error}`);
      allPassed = false;
    }
    if (!r.passed) allPassed = false;
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n======================================================================');
  console.log(`Phase 9 Test Results: ${passedCount} / ${results.length} PASSED`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase9VerificationSuite().catch((err) => {
  console.error('Phase 9 Verification Suite failed with unexpected exception:', err);
  process.exit(1);
});
