import { EventPromptContext } from '../aiProvider.js';

export function buildExplanationPrompt(context: EventPromptContext): string {
  const event = context.event;

  return `You are AKIRA's multi-level adaptive explanation engine.
Produce five progressive difficulty level explanations for this canonical real-world event.

EXPLANATION LEVEL GUIDELINES:
1. "verySimple": For an absolute beginner. Use a clear, memorable everyday analogy (e.g. "Think of X like Y..."). 2-3 short, friendly paragraphs. Avoid jargon.
2. "beginner": Clear, accessible context. Covers main actors, basic causes, and direct everyday consequences.
3. "student": College/academic level. Focuses on structural mechanisms, relationships, terminology, and cause-effect chains.
4. "technical": Domain-specific terminology, operational systems, regulatory framework, and technical dependencies.
5. "deepDive": Macro/systemic perspective. Second-order consequences, strategic equilibria, long-term institutional shifts, separating evidence from projection.

EVENT CONTEXT:
- Title: ${event.title}
- Summary: ${event.summary}
- Region: ${event.region || event.regionId || 'World'}
- Category: ${event.category || event.categoryId || 'General'}
- Why It Matters: ${event.whyItMatters || ''}

OUTPUT FORMAT (JSON ONLY):
{
  "verySimple": "...",
  "beginner": "...",
  "student": "...",
  "technical": "...",
  "deepDive": "..."
}`;
}
