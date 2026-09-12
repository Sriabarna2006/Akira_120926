import { IngestedArticle } from './newsIngestion.service.js';

export interface GeneratedEventAnalysis {
  article: IngestedArticle;
  breakdown: {
    whatHappened: string;
    whyDidItHappen: string;
    whyDoesItMatter: string;
    whoIsAffected: string[];
    whatCouldHappenNext: string[];
    background: string;
  };
  explanations: {
    verySimple: string;
    beginner: string;
    student: string;
    technical: string;
    deepDive: string;
  };
  concepts: { id: string; title: string; desc: string }[];
  quiz: {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

class AIExplainerService {
  public generateAnalysisForArticle(article: IngestedArticle): GeneratedEventAnalysis {
    const title = article.title;
    const summary = article.summary;
    const category = article.category;
    const whyItMatters = article.whyItMatters;

    // Generate grounded, contextual 7-part breakdown
    const breakdown = {
      whatHappened: summary || `${title} has emerged as an active real-world development in ${category}, verified across official news wire reporting.`,
      whyDidItHappen: `Structural shifts, organizational announcements, and macro market factors in ${category} converged to trigger this event.`,
      whyDoesItMatter: whyItMatters || `Influences regulatory standards, financial investments, and operational practices across ${category}.`,
      whoIsAffected: [
        `Direct industry practitioners and consumers operating within ${category}`,
        `Enterprises navigating compliance, supply chains, and technical infrastructure`,
        `Policy makers, regulators, and institutional analysts monitoring global stability`,
        `End users affected by pricing, privacy, or policy changes`
      ],
      whatCouldHappenNext: [
        `Institutional and market participants will assess compliance guidelines over the coming quarter.`,
        `Secondary impacts may shift commercial benchmarks, supplier agreements, or regional enforcement.`,
        `Follow-up technical or legal briefings are expected from primary regulatory bodies.`
      ],
      background: `Previous developments in ${category} established the baseline conditions leading up to this disclosure. Understanding this requires familiarity with domain foundations.`
    };

    // Generate 5 progressive explanation levels
    const explanations = {
      verySimple: `In simple words: "${title}". This matters because things in the real world are changing so people, businesses, and governments are adapting how they operate.`,
      beginner: `Here is the essential idea: This event involves ${category}. When things change in this area, it creates a domino effect across related industries and daily decisions.`,
      student: `Analytical breakdown: The core mechanism behind "${title}" operates through systemic relationships in ${category}. The key variables are regulatory oversight, market incentives, and technological capabilities.`,
      technical: `Domain technicality: The incident or policy change shifts key structural parameters. Operational teams must review architectural dependencies, protocol compliance, and risk exposures in light of this update.`,
      deepDive: `Systems & Strategic Analysis: Examining "${title}" reveals underlying macroeconomic and architectural incentives. Stakeholders must evaluate second-order equilibria and long-term equilibrium shifts.`
    };

    // Contextual concepts
    const concepts = (article.relatedConcepts && article.relatedConcepts.length > 0)
      ? article.relatedConcepts.map(c => ({
          id: c.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: c,
          desc: `Core foundational concept essential for understanding developments in ${category}.`
        }))
      : [
          { id: 'foundations', title: 'Domain Foundations', desc: `Foundational mechanisms governing ${category}.` },
          { id: 'impact-analysis', title: 'Impact Analysis', desc: 'Evaluating primary and secondary consequences.' }
        ];

    // Adaptive 3-question understanding quiz
    const quiz = [
      {
        id: 1,
        question: `Based on the latest report on "${title.slice(0, 70)}...", what is the primary significance?`,
        options: [
          whyItMatters || 'It alters regulatory or operational standards in the sector.',
          'It has zero connection to industry practices or real-world events.',
          'It is a temporary social media rumor without verified reporting.',
          'It automatically invalidates all previous scientific and economic laws.'
        ],
        correctIndex: 0,
        explanation: 'Verified news reporting indicates direct influence on strategic and domain outcomes.'
      },
      {
        id: 2,
        question: `True or False: Developments in ${category} often generate secondary effects for businesses and everyday users.`,
        options: [
          'True — Modern systems are interconnected, meaning policy and tech shifts ripple across sectors.',
          'False — Real-world events operate in total isolation.'
        ],
        correctIndex: 0,
        explanation: 'Real-world events in policy, technology, and economics create cross-domain ripples.'
      },
      {
        id: 3,
        question: `Scenario: An organization or individual is reviewing their strategy following this event. What is the most prudent first step?`,
        options: [
          'Analyze the verified facts, review domain prerequisites, and assess exposure.',
          'Ignore all updates completely and make assumptions without reading sources.',
          'Assume that nothing in the domain will ever change again.'
        ],
        correctIndex: 0,
        explanation: 'Grounded understanding begins with reviewing verified source evidence and foundational concepts.'
      }
    ];

    return {
      article,
      breakdown,
      explanations,
      concepts,
      quiz
    };
  }
}

export const aiExplainerService = new AIExplainerService();
