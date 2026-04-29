import { z } from "zod";

export const RawEventSchema = z.object({
  type: z.enum(["LLM_CALL", "TOOL_CALL", "AGENT_START", "AGENT_END", "ERROR", "CUSTOM"]),
  occurredAt: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()),
});

export const IngestPayloadSchema = z.object({
  agentId: z.string().min(1),
  sessionId: z.string().min(1),
  events: z.array(RawEventSchema).min(1).max(100), // Max 100 events per batch
});

export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
export type RawEventInput = z.infer<typeof RawEventSchema>;

// ─── Alert rule schema ────────────────────────────────────────────────────────

export const AlertRuleSchema = z.object({
  name: z.string().min(1).max(100),
  metric: z.enum(["COST_USD", "ERROR_RATE", "LATENCY_P95", "TOKEN_COUNT"]),
  operator: z.enum(["gt", "lt", "gte", "lte"]),
  threshold: z.number().positive(),
  windowMin: z.number().int().min(5).max(1440).default(60),
  channel: z.enum(["email", "slack", "webhook"]).default("email"),
  channelConfig: z.record(z.string(), z.unknown()).optional(),
});

// ─── API key creation schema ──────────────────────────────────────────────────

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

// ─── Agent creation schema ────────────────────────────────────────────────────

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  framework: z.string().max(50).optional(),
});
