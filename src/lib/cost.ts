/**
 * Cost per 1M tokens (USD) for common models.
 * Update these as providers change pricing.
 */
const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  // OpenAI
  "gpt-4o": { inputPer1M: 5.0, outputPer1M: 15.0 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gpt-4-turbo": { inputPer1M: 10.0, outputPer1M: 30.0 },
  "gpt-3.5-turbo": { inputPer1M: 0.5, outputPer1M: 1.5 },
  // Anthropic
  "claude-opus-4-6": { inputPer1M: 15.0, outputPer1M: 75.0 },
  "claude-sonnet-4-6": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-haiku-4-5": { inputPer1M: 0.25, outputPer1M: 1.25 },
  // Google
  "gemini-1.5-pro": { inputPer1M: 3.5, outputPer1M: 10.5 },
  "gemini-1.5-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
};

export function calculateCostUsd(
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  const pricing = MODEL_PRICING[model.toLowerCase()];
  if (!pricing) return 0;

  const cost =
    (tokensIn / 1_000_000) * pricing.inputPer1M +
    (tokensOut / 1_000_000) * pricing.outputPer1M;

  // Round to 6 decimal places (sub-cent precision)
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function getSupportedModels(): string[] {
  return Object.keys(MODEL_PRICING);
}
