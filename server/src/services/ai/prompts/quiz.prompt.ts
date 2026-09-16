import { EventPromptContext } from '../aiProvider.js';

export function buildQuizPrompt(context: EventPromptContext): string {
  const event = context.event;

  return `You are AKIRA's active recall quiz engine.
Generate exactly 3 high-quality multiple choice questions testing deep conceptual comprehension of this real-world event.

QUIZ RULES:
1. Exactly 3 questions.
2. 4 plausible, well-written options per question (no obvious giveaways, no joke answers).
3. Exactly ONE correct answer (0-indexed integer 0, 1, 2, or 3).
4. Provide a clear, educational explanation for why the correct option is right.
5. Focus on testing understanding of causes, consequences, and mechanisms rather than trivial date memorization.
6. Assign difficulty: "easy", "medium", or "hard".

EVENT CONTEXT:
- Title: ${event.title}
- Summary: ${event.summary}
- Region: ${event.region || event.regionId || 'World'}
- Category: ${event.category || event.categoryId || 'General'}
- Why It Matters: ${event.whyItMatters || ''}

OUTPUT FORMAT (JSON ONLY):
[
  {
    "id": 1,
    "question": "Clear conceptual question testing primary mechanism or impact?",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this answer is correct based on the event context.",
    "difficulty": "easy"
  },
  {
    "id": 2,
    "question": "Question testing systemic relationships or secondary effects?",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctAnswer": 1,
    "explanation": "Explanation for question 2.",
    "difficulty": "medium"
  },
  {
    "id": 3,
    "question": "Scenario or application-based question testing decision-making or governance implication?",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctAnswer": 2,
    "explanation": "Explanation for question 3.",
    "difficulty": "hard"
  }
]`;
}
