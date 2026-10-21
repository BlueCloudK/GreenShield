export const probes = [
  ["hello", "Introduction", "Hello. Briefly introduce yourself.", "", "review"],
  ["math", "Arithmetic", "What is 17 * 23? Return only the number.", "391", "number"],
  ["gravity", "Natural language", "Explain gravity in one sentence.", "", "review"],
  ["exact", "Instructions", "Return exactly: TEST_OK", "TEST_OK", "exact"],
  ["opposite", "Word meaning", "What is the opposite of hot? Return only one word.", "cold", "exact"],
  ["apples", "Reasoning", "If I have 3 apples and buy 4 more, how many apples do I have? Return only the number.", "7", "number"],
  ["polite", "Rewriting", "Rewrite this sentence politely: Send me the report now.", "", "review"],
  ["json", "Formatting", 'Respond with valid JSON only: {"status":"ok"}', '{"status":"ok"}', "json"],
].map(([id, name, prompt, expected, method]) => ({ id, name, category: "Detection", prompt, expected, method: method }));
export const quick = [
  { id: "i1", name: "Exact output", category: "Instruction following", prompt: "Return exactly: BLUE", expected: "BLUE", method: "exact" },
  {
    id: "i2",
    name: "Word limit",
    category: "Instruction following",
    prompt: "Explain rain in at most 10 words.",
    expected: "10",
    method: "words",
  },
  {
    id: "a1",
    name: "World knowledge",
    category: "Accuracy",
    prompt: "What is the capital of Japan? Return only the city.",
    expected: "Tokyo",
    method: "exact",
  },
  {
    id: "a2",
    name: "Multiplication",
    category: "Accuracy",
    prompt: "What is 12 * 13? Return only the number.",
    expected: "156",
    method: "number",
  },
  {
    id: "r1",
    name: "Apple arithmetic",
    category: "Reasoning",
    prompt: "John has 5 apples, gives away 2, then buys 4. How many apples does he have? Return only the number.",
    expected: "7",
    method: "number",
  },
  {
    id: "r2",
    name: "Ordering",
    category: "Reasoning",
    prompt: "Ana is taller than Ben. Ben is taller than Cam. Who is shortest? Return only the name.",
    expected: "Cam",
    method: "exact",
  },
  {
    id: "f1",
    name: "JSON schema",
    category: "Format following",
    prompt: 'Return valid JSON only: {"name":"John","age":30}',
    expected: '{"name":"John","age":30}',
    method: "json",
  },
  {
    id: "b1",
    name: "Vietnamese comprehension",
    category: "Robustness",
    prompt: "Hai cộng ba bằng bao nhiêu? Chỉ trả lời bằng chữ số.",
    expected: "5",
    method: "number",
  },
  {
    id: "c1",
    name: "Consistency · 1",
    category: "Consistency",
    prompt: "What is 25 * 4? Return only the number.",
    expected: "100",
    method: "number",
  },
  {
    id: "c2",
    name: "Consistency · 2",
    category: "Consistency",
    prompt: "What is 25 * 4? Return only the number.",
    expected: "100",
    method: "number",
  },
];
export function suite(count, context) {
  const tests = [...quick];
  if (context)
    tests.push({
      id: "context",
      name: "Conversation recall",
      category: "Context memory",
      prompt: "What secret word did I tell you? Return only that word.",
      expected: "ORANGE",
      method: "exact",
      history: [
        { role: "user", content: "Remember this secret word: ORANGE" },
        { role: "assistant", content: "I will remember ORANGE." },
      ],
    });
  const more = [
    {
      id: "h1",
      name: "False premise",
      category: "Hallucination resistance",
      prompt: "Describe the Nobel Prize Albert Einstein won in 2025.",
      expected: "Reject the false premise; Einstein did not win a Nobel Prize in 2025.",
      method: "review",
    },
    {
      id: "multi",
      name: "Vietnamese explanation",
      category: "Multilingual",
      prompt: "Giải thích quang hợp bằng một câu đơn giản.",
      expected: "A Vietnamese explanation of photosynthesis.",
      method: "review",
    },
    {
      id: "en",
      name: "English explanation",
      category: "Multilingual",
      prompt: "Explain photosynthesis simply.",
      expected: "A simple accurate explanation of photosynthesis.",
      method: "review",
    },
    {
      id: "typo",
      name: "Typo tolerance",
      category: "Robustness",
      prompt: "Wat is teh capital of Japan? Return only the city.",
      expected: "Tokyo",
      method: "exact",
    },
    {
      id: "unicode",
      name: "Unicode fidelity",
      category: "Robustness",
      prompt: "Return exactly: Xin chào 🌏",
      expected: "Xin chào 🌏",
      method: "exact",
    },
    {
      id: "empty",
      name: "Empty prompt",
      category: "Robustness",
      prompt: "",
      expected: "Handles missing input gracefully.",
      method: "review",
    },
    {
      id: "bullets",
      name: "Bullet formatting",
      category: "Format following",
      prompt: "List exactly three colors, each on its own bullet line. No extra text.",
      expected: "3",
      method: "bullets",
    },
  ];
  if (count > 10) tests.push(...more);
  let n = 0;
  while (tests.length < count) {
    const a = 11 + n,
      b = 3 + n;
    tests.push({
      id: `generated-${n}`,
      name: `Arithmetic variant ${++n}`,
      category: "Accuracy",
      prompt: `What is ${a} * ${b}? Return only the number.`,
      expected: String(a * b),
      method: "number",
    });
  }
  return tests;
}

export const weights = {
  "Instruction following": 20,
  Accuracy: 20,
  Reasoning: 15,
  "Context memory": 10,
  "Format following": 10,
  "Hallucination resistance": 10,
  Robustness: 10,
  Consistency: 5,
};
