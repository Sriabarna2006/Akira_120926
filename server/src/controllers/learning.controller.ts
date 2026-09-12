import { Request, Response } from 'express';

export const getConcepts = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'monetary-policy',
        title: 'Monetary Policy',
        category: 'Economy & Money',
        definition: 'The strategy and tools used by a central bank to control the money supply and achieve sustainable economic growth.',
        prerequisites: ['Inflation', 'Interest Rates', 'Central Bank']
      },
      {
        id: 'ai-governance',
        title: 'AI Governance',
        category: 'AI & Technology',
        definition: 'Legal, ethical, and operational framework ensuring AI systems are safe, explainable, and aligned with human values.',
        prerequisites: ['Machine Learning', 'Data Privacy']
      }
    ]
  });
};

export const submitQuiz = async (req: Request, res: Response) => {
  const { eventId, answers } = req.body;

  res.json({
    success: true,
    data: {
      eventId,
      score: 3,
      totalQuestions: 3,
      masteryUpdated: true,
      categoryBonusPoints: 15
    }
  });
};
