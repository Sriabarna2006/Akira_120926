import { AIProvider, EventPromptContext } from '../aiProvider.js';
import { 
  FiveWOneH, 
  MultiLevelExplanation, 
  ExtractedConcept, 
  QuizQuestion 
} from '../../../types/index.js';

export class DeterministicProvider implements AIProvider {
  public readonly name = 'deterministic';
  public readonly modelName = 'akira-deterministic-v1';

  public async generate5W1H(context: EventPromptContext): Promise<FiveWOneH> {
    const { event, articles = [] } = context;
    const title = event.title;
    const summary = event.summary;
    const region = event.region || event.regionId || 'World';
    const category = event.category || event.categoryId || 'General';
    const whyItMatters = event.whyItMatters;

    return {
      whatHappened: summary || `Verified multi-source reporting confirms: ${title} in ${region}.`,
      whyDidItHappen: `Structural administrative, economic, or technological milestones converged to trigger this development in ${region}.`,
      whyDoesItMatter: whyItMatters || `Directly influences institutional frameworks, market operations, and citizen welfare within ${category}.`,
      whoIsAffected: [
        `Citizens, households, and residents in ${region}`,
        `Enterprises and industrial participants operating within ${category}`,
        `Regulatory authorities and administrative policymakers monitoring regional governance`
      ],
      whatCouldHappenNext: [
        `Confirmed: Relevant authorities will release implementation schedules and operational guidelines.`,
        `Possible: Regional stakeholders may adjust capital investments and compliance procedures.`,
        `Unknown: Long-term macro trajectory will be monitored in subsequent quarterly reviews.`
      ],
      background: `Prior strategic initiatives and historical context in ${region} established the foundation for this announcement. Understanding this requires familiarity with core ${category} mechanisms.`
    };
  }

  public async generateExplanationLevels(context: EventPromptContext): Promise<MultiLevelExplanation> {
    const { event } = context;
    const title = event.title;
    const region = event.region || event.regionId || 'World';
    const category = event.category || event.categoryId || 'General';

    return {
      verySimple: `Think of this like a major community rule update: "${title}". Just like when traffic rules are adjusted to help everyone commute safely, leaders in ${region} are making changes so that ${category} works better for everyday people.`,
      beginner: `Here is the essential takeaway: "${title}" happened in ${region}. In the realm of ${category}, when key policies or technologies shift, it creates a ripple effect that touches jobs, prices, and public services for everyone.`,
      student: `Analytical breakdown: The mechanism behind "${title}" operates through systemic relationships in ${category}. The primary variables are governance oversight, economic incentives, and institutional execution in ${region}, influencing supply-demand balance and regional stability.`,
      technical: `Domain technicality: The development alters key parameters in ${category}. Operational teams and architects must review statutory compliance benchmarks, technological dependencies, and risk exposures in ${region} to maintain alignment with updated standards.`,
      deepDive: `Systems & Strategic Analysis: Evaluating "${title}" reveals underlying structural equilibria in ${region}. Stakeholders must examine second-order consequences, strategic incentives, and long-term capital allocation shifts, while distinguishing confirmed milestones from future projections.`
    };
  }

  public async extractConcepts(context: EventPromptContext): Promise<ExtractedConcept[]> {
    const { event } = context;
    const category = event.category || event.categoryId || 'general';

    if (event.relatedConcepts && event.relatedConcepts.length > 0) {
      return event.relatedConcepts.map((c, idx) => ({
        id: c.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: c,
        slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDefinition: `A core foundational mechanism essential for understanding developments in ${category}.`,
        whyItMatters: `Crucial for evaluating policy, technology, and economic impacts in ${event.region || 'the region'}.`,
        category,
        prerequisites: idx > 0 ? [event.relatedConcepts![idx - 1].toLowerCase().replace(/[^a-z0-9]+/g, '-')] : []
      }));
    }

    return [
      {
        id: 'policy-governance',
        title: 'Policy & Governance',
        slug: 'policy-governance',
        shortDefinition: 'The framework of laws, rules, and administrative processes through which institutions govern.',
        whyItMatters: 'Shapes statutory obligations and public resource allocation.',
        category,
        prerequisites: []
      },
      {
        id: 'impact-evaluation',
        title: 'Impact Evaluation',
        slug: 'impact-evaluation',
        shortDefinition: 'The systematic analysis of primary, secondary, and long-term outcomes of an event.',
        whyItMatters: 'Helps citizens and organizations make evidence-based decisions.',
        category,
        prerequisites: ['policy-governance']
      },
      {
        id: 'systemic-equilibrium',
        title: 'Systemic Equilibrium',
        slug: 'systemic-equilibrium',
        shortDefinition: 'The state of balance across interconnected economic, technological, or social factors.',
        whyItMatters: 'Determines whether an intervention causes structural stability or volatility.',
        category,
        prerequisites: ['impact-evaluation']
      }
    ];
  }

  public async generateQuiz(context: EventPromptContext): Promise<QuizQuestion[]> {
    const { event } = context;
    const title = event.title;
    const region = event.region || event.regionId || 'World';
    const category = event.category || event.categoryId || 'General';
    const whyItMatters = event.whyItMatters || 'It directly impacts regional operations and public welfare.';

    return [
      {
        id: 1,
        question: `Based on verified reporting on "${title.slice(0, 60)}...", what is the core significance for ${region}?`,
        options: [
          whyItMatters,
          'It has zero real-world connection and can be safely ignored.',
          'It completely halts all economic and social activity permanently.',
          'It is an unverified social media rumor with no news coverage.'
        ],
        correctAnswer: 0,
        explanation: 'Multi-source verified reporting confirms direct real-world significance for the region.',
        difficulty: 'easy'
      },
      {
        id: 2,
        question: `In the context of ${category}, how do structural policy and technological updates typically affect organizations and citizens in ${region}?`,
        options: [
          'They create interconnected secondary effects across supply chains, regulations, and public services.',
          'They only affect people who work inside government buildings.',
          'They reverse all historical laws instantly without notice.',
          'They have no effect because systems operate in complete isolation.'
        ],
        correctAnswer: 0,
        explanation: 'Modern systems are deeply interconnected; shifts in governance or technology trigger wide systemic effects.',
        difficulty: 'medium'
      },
      {
        id: 3,
        question: `Scenario: A decision-maker or citizen in ${region} is evaluating this development. What is the most evidence-based course of action?`,
        options: [
          'Act impulsively based on unverified headlines and social media rumors.',
          'Review verified reporting, understand core mechanisms, and monitor official notifications.',
          'Assume that policies and economic conditions will never change again.',
          'Disregard verified data and rely solely on speculation.'
        ],
        correctAnswer: 1,
        explanation: 'Grounded comprehension and decision-making depend on reviewing verified sources and monitoring official guidelines.',
        difficulty: 'hard'
      }
    ];
  }
}
