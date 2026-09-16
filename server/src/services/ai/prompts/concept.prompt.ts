import { EventPromptContext } from '../aiProvider.js';

export function buildConceptPrompt(context: EventPromptContext): string {
  const event = context.event;

  return `You are AKIRA's knowledge graph concept extraction engine.
Extract 3 to 5 foundational concepts necessary to truly understand this event, along with prerequisite relationships.

EVENT CONTEXT:
- Title: ${event.title}
- Summary: ${event.summary}
- Category: ${event.category || event.categoryId || 'General'}
- Region: ${event.region || event.regionId || 'World'}

OUTPUT FORMAT (JSON ONLY):
[
  {
    "id": "concept-slug",
    "title": "Concept Title",
    "slug": "concept-slug",
    "shortDefinition": "A clear, 1-2 sentence core definition.",
    "whyItMatters": "Why this mechanism is critical to this domain.",
    "category": "${event.category || 'general'}",
    "prerequisites": ["prerequisite-concept-slug-if-any"]
  }
]`;
}
