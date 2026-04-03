export const QUESTION_BANK = {
  ela: [
    {
      id: "ela-1",
      domain: "ela",
      difficulty: 1,
      type: "mcq",
      prompt: "The sky looked gloomy before the storm. What does gloomy mean?",
      choices: ["Dark and cloudy", "Bright", "Hot", "Clear"],
      answer: "Dark and cloudy",
      explanation: "Gloomy describes something dark, dim, or overcast."
    },
    {
      id: "ela-2",
      domain: "ela",
      difficulty: 1,
      type: "mcq",
      prompt: "Which word is a synonym for happy?",
      choices: ["Joyful", "Sleepy", "Heavy", "Nervous"],
      answer: "Joyful",
      explanation: "A synonym is a word with a similar meaning."
    },
    {
      id: "ela-3",
      domain: "ela",
      difficulty: 2,
      type: "short",
      prompt: "Write one sentence using the word because.",
      validator: {
        minLength: 12,
        includes: ["because"]
      },
      explanation: "A valid response should use the word because in a complete sentence."
    },
    {
      id: "ela-4",
      domain: "ela",
      difficulty: 2,
      type: "mcq",
      prompt: "Read the sentence: Maria ran quickly to catch the bus. Which word tells how Maria ran?",
      choices: ["Maria", "ran", "quickly", "bus"],
      answer: "quickly",
      explanation: "Quickly describes the action and functions as an adverb."
    }
  ],
  math: [
    {
      id: "math-1",
      domain: "math",
      difficulty: 1,
      type: "mcq",
      prompt: "What is 8 + 7?",
      choices: ["13", "14", "15", "16"],
      answer: "15",
      explanation: "8 + 7 = 15."
    },
    {
      id: "math-2",
      domain: "math",
      difficulty: 1,
      type: "short",
      prompt: "Solve: 6 × 4",
      validator: {
        numeric: 24
      },
      explanation: "6 times 4 equals 24."
    },
    {
      id: "math-3",
      domain: "math",
      difficulty: 2,
      type: "mcq",
      prompt: "A rectangle has a length of 9 and a width of 3. What is its area?",
      choices: ["12", "18", "27", "36"],
      answer: "27",
      explanation: "Area of a rectangle = length × width."
    }
  ]
};

export function getQuestionsForSubject(subjectKey) {
  return QUESTION_BANK[subjectKey] || [];
}
