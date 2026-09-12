import { CanonicalEvent } from './newsIngestion.service.js';

export interface GeneratedEventAnalysis {
  event: CanonicalEvent;
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
  public generateAnalysisForEvent(event: CanonicalEvent): GeneratedEventAnalysis {
    const title = event.title;
    const summary = event.summary;
    const category = event.category;
    const region = event.region;
    const whyItMatters = event.whyItMatters;

    // 7-Part Breakdown
    const breakdown = {
      whatHappened: summary || `${title} has been confirmed across multi-source verified reporting in ${region} within ${category}.`,
      whyDidItHappen: `Structural factors, state/national administrative announcements, and strategic shifts converged to trigger this event in ${region}.`,
      whyDoesItMatter: whyItMatters || `Directly alters policy execution, commercial operations, and institutional standards in ${category}.`,
      whoIsAffected: [
        `Citizens, industry practitioners, and communities situated in ${region}`,
        `Enterprises navigating regulatory standards, supply logistics, or funding`,
        `Policy makers and civic administrators monitoring regional stability`,
        `End consumers impacted by public service, tariff, or price changes`
      ],
      whatCouldHappenNext: [
        `Administrative committees will release detailed operational guidelines over the coming days.`,
        `Industry and institutional participants will calibrate their annual plans accordingly.`,
        `Subsequent implementation milestones will be reviewed in upcoming government reviews.`
      ],
      background: `Previous developments in ${region} established the groundwork leading up to this disclosure. Understanding this event requires familiarity with core domain mechanisms.`
    };

    // 5 Progressive Difficulty Levels
    const explanations = {
      verySimple: `In simple words: "${title}". This matters because people, businesses, and leaders in ${region} are making important adjustments to keep things running better.`,
      beginner: `Here is the essential takeaway: This development takes place in ${region} under ${category}. When policy or technology changes here, it creates a chain reaction for public services and everyday life.`,
      student: `Analytical overview: The core mechanism of "${title}" operates through systemic relationships in ${category}. The key variables are governance oversight, market incentives, and technological execution in ${region}.`,
      technical: `Domain technicality: The initiative shifts key structural parameters. Operational teams must review architectural dependencies, statutory compliance guidelines, and risk exposures in light of this update.`,
      deepDive: `Systems & Strategic Analysis: Examining "${title}" reveals underlying macroeconomic and regional equilibria in ${region}. Stakeholders must evaluate second-order incentives and long-term institutional shifts.`
    };

    // Concepts
    const concepts = (event.relatedConcepts && event.relatedConcepts.length > 0)
      ? event.relatedConcepts.map(c => ({
          id: c.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: c,
          desc: `Core foundational mechanism essential for understanding developments in ${category}.`
        }))
      : [
          { id: 'public-policy', title: 'Public Policy', desc: `Governance and administrative frameworks in ${region}.` },
          { id: 'impact-analysis', title: 'Impact Analysis', desc: 'Evaluating primary and secondary consequences.' }
        ];

    // Adaptive 3-Question Understanding Quiz
    const quiz = [
      {
        id: 1,
        question: `Based on the latest reports on "${title.slice(0, 70)}...", what is the primary significance for ${region}?`,
        options: [
          whyItMatters || `It impacts governance, technology, or economic operations in ${region}.`,
          'It has zero connection to real-world affairs and can be disregarded.',
          'It is an unverified social media rumor with zero news coverage.',
          'It immediately stops all economic activity permanently.'
        ],
        correctIndex: 0,
        explanation: 'Multi-source verified reporting confirms direct real-world significance.'
      },
      {
        id: 2,
        question: `True or False: Developments in ${category} in ${region} typically create secondary effects for organizations and citizens.`,
        options: [
          'True — Modern systems are interconnected, so policy and tech shifts create regional ripple effects.',
          'False — Real-world events have zero consequences.'
        ],
        correctIndex: 0,
        explanation: 'Modern policy, tech, and economic updates create systemic secondary effects.'
      },
      {
        id: 3,
        question: `Scenario: A resident or business in ${region} is evaluating this announcement. What is the most prudent next step?`,
        options: [
          'Review verified sources, understand foundational concepts, and monitor official notifications.',
          'Make hasty decisions based on hearsay without checking original sources.',
          'Assume that laws and policies will never evolve.'
        ],
        correctIndex: 0,
        explanation: 'Grounded decision-making starts with reviewing verified reports and foundational mechanisms.'
      }
    ];

    return {
      event,
      breakdown,
      explanations,
      concepts,
      quiz
    };
  }
}

export const aiExplainerService = new AIExplainerService();
