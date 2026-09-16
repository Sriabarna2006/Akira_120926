import { EventPromptContext } from '../aiProvider.js';

export function build5W1HPrompt(context: EventPromptContext): string {
  const event = context.event;
  const sources = event.sources || [];
  const articles = context.articles || [];

  return `You are AKIRA's fact-grounded intelligence understanding engine.
Analyze this canonical real-world event and output structured 5W1H knowledge in strictly valid JSON.

GROUNDING RULES:
1. Use ONLY the supplied information and essential background domain mechanisms.
2. DO NOT invent facts, statistics, quotes, or sources.
3. If an aspect is unconfirmed or unknown, explicitly declare it as "Uncertain / Under Review".
4. Distinguish between verified facts and reasonable interpretations.

CANONICAL EVENT CONTEXT:
- Title: ${event.title}
- Summary: ${event.summary}
- Region: ${event.region || event.regionId || 'World'}
- Category: ${event.category || event.categoryId || 'General'}
- Why It Matters: ${event.whyItMatters || 'High regional / domain significance'}
- Corroborating Sources: ${sources.map((s) => `${s.sourceName} (${s.title})`).join(', ') || 'Verified News Outlets'}
- Article Excerpts: ${articles.map((a) => a.contentSnippet).filter(Boolean).join(' | ').slice(0, 1000) || 'None'}

OUTPUT FORMAT (JSON ONLY):
{
  "whatHappened": "Concise, fact-grounded narrative of what occurred.",
  "whyDidItHappen": "The structural, political, or economic causes that led to this.",
  "whyDoesItMatter": "Why an everyday person or professional should care.",
  "whoIsAffected": [
    "Specific impacted group 1",
    "Specific impacted group 2",
    "Specific impacted group 3"
  ],
  "whatCouldHappenNext": [
    "Confirmed next step: ...",
    "Possible outcome: ...",
    "Unknown / Under observation: ..."
  ],
  "background": "The historical, legislative, or technological context necessary to comprehend this event."
}`;
}
