import type {
  KeyCapabilityType,
  KeyPartnerType,
  KeyResourceType,
  ProcessCanvasBlueprint,
} from "./processCanvasDomain.ts";
import { buildProcessCanvasDefinitionText } from "./processCanvasDefinitions.ts";

export type AINameDescription = {
  name: string;
  description: string;
};

export type AIOtherBeneficiary = {
  name: string;
  benefitDescription: string;
};

/**
 * Content-only representation returned by the AI layer.
 *
 * Deliberately excludes application-owned fields such as ids, timestamps,
 * version numbers, and other editor metadata. Empty strings/arrays mean the
 * source description did not provide enough information to populate a field.
 */
export type AIProcessCanvasDraft = {
  name: string;
  purpose: string;
  goals: string[];

  desirability: {
    customers: string[];
    otherBeneficiaries: AIOtherBeneficiary[];
    customerRelationships: string[];
    customerChannels: string[];
  };

  feasibility: {
    keyActivities: string[];
    keyPartners: {
      suppliers: AINameDescription[];
      enablers: AINameDescription[];
    };
    keyCapabilities: {
      execution: string[];
      dynamic: string[];
    };
    keyPoliciesRegulations: AINameDescription[];
    keyResources: {
      human: AINameDescription[];
      physical: AINameDescription[];
      digital: AINameDescription[];
    };
  };

  viability: {
    economic: {
      costs: string[];
      benefits: string[];
    };
    environmental: {
      negative: string[];
      positive: string[];
    };
    social: {
      negative: string[];
      positive: string[];
    };
  };

  responsibility: {
    privacySecurity: string[];
    fairnessEthics: string[];
    transparencyExplainability: string[];
    accountabilityContestability: string[];
  };
};

export function makeEmptyAIProcessCanvasDraft(): AIProcessCanvasDraft {
  return {
    name: "",
    purpose: "",
    goals: [],
    desirability: {
      customers: [],
      otherBeneficiaries: [],
      customerRelationships: [],
      customerChannels: [],
    },
    feasibility: {
      keyActivities: [],
      keyPartners: {
        suppliers: [],
        enablers: [],
      },
      keyCapabilities: {
        execution: [],
        dynamic: [],
      },
      keyPoliciesRegulations: [],
      keyResources: {
        human: [],
        physical: [],
        digital: [],
      },
    },
    viability: {
      economic: { costs: [], benefits: [] },
      environmental: { negative: [], positive: [] },
      social: { negative: [], positive: [] },
    },
    responsibility: {
      privacySecurity: [],
      fairnessEthics: [],
      transparencyExplainability: [],
      accountabilityContestability: [],
    },
  };
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function cleanNameDescriptions(value: unknown): AINameDescription[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = cleanString(record.name);
      const description = cleanString(record.description);
      if (!name) return null;
      return { name, description };
    })
    .filter((item): item is AINameDescription => item !== null);
}

function cleanOtherBeneficiaries(value: unknown): AIOtherBeneficiary[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = cleanString(record.name);
      const benefitDescription = cleanString(record.benefitDescription);
      if (!name) return null;
      return { name, benefitDescription };
    })
    .filter((item): item is AIOtherBeneficiary => item !== null);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/**
 * Runtime defensive normalization for data crossing the AI/API boundary.
 * Structured output should already match the schema, but this prevents malformed
 * or partially missing data from leaking into the editor state.
 */
export function normalizeAIProcessCanvasDraft(input: unknown): AIProcessCanvasDraft {
  const root = asRecord(input);
  const desirability = asRecord(root.desirability);
  const feasibility = asRecord(root.feasibility);
  const keyPartners = asRecord(feasibility.keyPartners);
  const keyCapabilities = asRecord(feasibility.keyCapabilities);
  const keyResources = asRecord(feasibility.keyResources);
  const viability = asRecord(root.viability);
  const economic = asRecord(viability.economic);
  const environmental = asRecord(viability.environmental);
  const social = asRecord(viability.social);
  const responsibility = asRecord(root.responsibility);

  return {
    name: cleanString(root.name),
    purpose: cleanString(root.purpose),
    goals: cleanStringArray(root.goals),
    desirability: {
      customers: cleanStringArray(desirability.customers),
      otherBeneficiaries: cleanOtherBeneficiaries(desirability.otherBeneficiaries),
      customerRelationships: cleanStringArray(desirability.customerRelationships),
      customerChannels: cleanStringArray(desirability.customerChannels),
    },
    feasibility: {
      keyActivities: cleanStringArray(feasibility.keyActivities),
      keyPartners: {
        suppliers: cleanNameDescriptions(keyPartners.suppliers),
        enablers: cleanNameDescriptions(keyPartners.enablers),
      },
      keyCapabilities: {
        execution: cleanStringArray(keyCapabilities.execution),
        dynamic: cleanStringArray(keyCapabilities.dynamic),
      },
      keyPoliciesRegulations: cleanNameDescriptions(feasibility.keyPoliciesRegulations),
      keyResources: {
        human: cleanNameDescriptions(keyResources.human),
        physical: cleanNameDescriptions(keyResources.physical),
        digital: cleanNameDescriptions(keyResources.digital),
      },
    },
    viability: {
      economic: {
        costs: cleanStringArray(economic.costs),
        benefits: cleanStringArray(economic.benefits),
      },
      environmental: {
        negative: cleanStringArray(environmental.negative),
        positive: cleanStringArray(environmental.positive),
      },
      social: {
        negative: cleanStringArray(social.negative),
        positive: cleanStringArray(social.positive),
      },
    },
    responsibility: {
      privacySecurity: cleanStringArray(responsibility.privacySecurity),
      fairnessEthics: cleanStringArray(responsibility.fairnessEthics),
      transparencyExplainability: cleanStringArray(responsibility.transparencyExplainability),
      accountabilityContestability: cleanStringArray(responsibility.accountabilityContestability),
    },
  };
}

function mapNameDescriptions<TType extends KeyPartnerType | KeyResourceType>(
  items: AINameDescription[],
  type: TType,
  prefix: string
): Array<{ id: string; type: TType; name: string; description?: string }> {
  return items.map((item) => ({
    id: makeId(prefix),
    type,
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
  }));
}

function mapCapabilities(items: string[], type: KeyCapabilityType) {
  return items.map((description) => ({
    id: makeId("cap"),
    type,
    description,
  }));
}

function mapValueItems(items: string[], prefix: string) {
  return items.map((description) => ({ id: makeId(prefix), description }));
}

function mapResponsibility(items: string[], prefix: string) {
  return items.map((description) => ({ id: makeId(prefix), description }));
}

/**
 * Converts content produced by AI into the application's canonical blueprint.
 * All ids and metadata are created locally by the application.
 */
export function aiDraftToProcessCanvasBlueprint(input: unknown): ProcessCanvasBlueprint {
  const draft = normalizeAIProcessCanvasDraft(input);
  const now = new Date().toISOString();

  return {
    meta: {
      id: makeId("pcb"),
      name: draft.name || "AI-generated Process Canvas",
      version: "1.0.0",
      createdAt: now,
      updatedAt: now,
    },

    goals: draft.goals.map((statement) => ({ id: makeId("goal"), statement })),

    desirability: {
      purpose: draft.purpose,
      customers: draft.desirability.customers.map((name) => ({ id: makeId("cust"), name })),
      otherBeneficiaries: draft.desirability.otherBeneficiaries.map((item) => ({
        id: makeId("benef"),
        name: item.name,
        ...(item.benefitDescription ? { benefitDescription: item.benefitDescription } : {}),
      })),
      customerRelationships: draft.desirability.customerRelationships.map((description) => ({
        id: makeId("rel"),
        description,
      })),
      customerChannels: draft.desirability.customerChannels.map((description) => ({
        id: makeId("chan"),
        description,
      })),
    },

    feasibility: {
      keyActivities: draft.feasibility.keyActivities.map((description) => ({
        id: makeId("act"),
        description,
      })),
      keyPartners: [
        ...mapNameDescriptions(draft.feasibility.keyPartners.suppliers, "supplier", "partner"),
        ...mapNameDescriptions(draft.feasibility.keyPartners.enablers, "enabler", "partner"),
      ],
      keyCapabilities: [
        ...mapCapabilities(draft.feasibility.keyCapabilities.execution, "executionCapability"),
        ...mapCapabilities(draft.feasibility.keyCapabilities.dynamic, "dynamicCapability"),
      ],
      keyPoliciesRegulations: draft.feasibility.keyPoliciesRegulations.map((item) => ({
        id: makeId("pol"),
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
      })),
      keyResources: [
        ...mapNameDescriptions(draft.feasibility.keyResources.human, "humanResource", "res"),
        ...mapNameDescriptions(draft.feasibility.keyResources.physical, "physicalResource", "res"),
        ...mapNameDescriptions(draft.feasibility.keyResources.digital, "digitalResource", "res"),
      ],
    },

    viability: {
      economic: {
        costs: mapValueItems(draft.viability.economic.costs, "cost"),
        benefits: mapValueItems(draft.viability.economic.benefits, "ben"),
      },
      environmental: {
        negative: mapValueItems(draft.viability.environmental.negative, "envn"),
        positive: mapValueItems(draft.viability.environmental.positive, "envp"),
      },
      social: {
        negative: mapValueItems(draft.viability.social.negative, "socn"),
        positive: mapValueItems(draft.viability.social.positive, "socp"),
      },
    },

    responsibility: {
      privacySecurity: mapResponsibility(draft.responsibility.privacySecurity, "priv"),
      fairnessEthics: mapResponsibility(draft.responsibility.fairnessEthics, "fair"),
      transparencyExplainability: mapResponsibility(
        draft.responsibility.transparencyExplainability,
        "tran"
      ),
      accountabilityContestability: mapResponsibility(
        draft.responsibility.accountabilityContestability,
        "acct"
      ),
    },
  };
}


/**
 * Strict JSON Schema for the AI content boundary. Every property is required;
 * unknown/unsupported information is represented by an empty string or array.
 * Application-owned ids and metadata are intentionally absent.
 */
export const PROCESS_CANVAS_AI_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "purpose", "goals", "desirability", "feasibility", "viability", "responsibility"],
  properties: {
    name: { type: "string" },
    purpose: { type: "string" },
    goals: { type: "array", items: { type: "string" } },
    desirability: {
      type: "object",
      additionalProperties: false,
      required: ["customers", "otherBeneficiaries", "customerRelationships", "customerChannels"],
      properties: {
        customers: { type: "array", items: { type: "string" } },
        otherBeneficiaries: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "benefitDescription"],
            properties: {
              name: { type: "string" },
              benefitDescription: { type: "string" },
            },
          },
        },
        customerRelationships: { type: "array", items: { type: "string" } },
        customerChannels: { type: "array", items: { type: "string" } },
      },
    },
    feasibility: {
      type: "object",
      additionalProperties: false,
      required: ["keyActivities", "keyPartners", "keyCapabilities", "keyPoliciesRegulations", "keyResources"],
      properties: {
        keyActivities: { type: "array", items: { type: "string" } },
        keyPartners: {
          type: "object",
          additionalProperties: false,
          required: ["suppliers", "enablers"],
          properties: {
            suppliers: { type: "array", items: { $ref: "#/$defs/nameDescription" } },
            enablers: { type: "array", items: { $ref: "#/$defs/nameDescription" } },
          },
        },
        keyCapabilities: {
          type: "object",
          additionalProperties: false,
          required: ["execution", "dynamic"],
          properties: {
            execution: { type: "array", items: { type: "string" } },
            dynamic: { type: "array", items: { type: "string" } },
          },
        },
        keyPoliciesRegulations: { type: "array", items: { $ref: "#/$defs/nameDescription" } },
        keyResources: {
          type: "object",
          additionalProperties: false,
          required: ["human", "physical", "digital"],
          properties: {
            human: { type: "array", items: { $ref: "#/$defs/nameDescription" } },
            physical: { type: "array", items: { $ref: "#/$defs/nameDescription" } },
            digital: { type: "array", items: { $ref: "#/$defs/nameDescription" } },
          },
        },
      },
    },
    viability: {
      type: "object",
      additionalProperties: false,
      required: ["economic", "environmental", "social"],
      properties: {
        economic: { $ref: "#/$defs/positiveNegativePair" },
        environmental: { $ref: "#/$defs/negativePositivePair" },
        social: { $ref: "#/$defs/negativePositivePair" },
      },
    },
    responsibility: {
      type: "object",
      additionalProperties: false,
      required: ["privacySecurity", "fairnessEthics", "transparencyExplainability", "accountabilityContestability"],
      properties: {
        privacySecurity: { type: "array", items: { type: "string" } },
        fairnessEthics: { type: "array", items: { type: "string" } },
        transparencyExplainability: { type: "array", items: { type: "string" } },
        accountabilityContestability: { type: "array", items: { type: "string" } },
      },
    },
  },
  $defs: {
    nameDescription: {
      type: "object",
      additionalProperties: false,
      required: ["name", "description"],
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
    },
    positiveNegativePair: {
      type: "object",
      additionalProperties: false,
      required: ["costs", "benefits"],
      properties: {
        costs: { type: "array", items: { type: "string" } },
        benefits: { type: "array", items: { type: "string" } },
      },
    },
    negativePositivePair: {
      type: "object",
      additionalProperties: false,
      required: ["negative", "positive"],
      properties: {
        negative: { type: "array", items: { type: "string" } },
        positive: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

export type ProcessCanvasAIPrompt = {
  system: string;
  user: string;
};

/**
 * Builds the prompt pair that the future server/edge function will send to the
 * model. It deliberately favors a useful partial draft over speculative filling.
 */
export function buildProcessCanvasAIPrompt(processDescription: string): ProcessCanvasAIPrompt {
  const source = processDescription.trim();

  const system = `You are creating a first-draft Process Canvas from a user's process description.

Use these Process Canvas definitions as the authoritative interpretation of the elements:
${buildProcessCanvasDefinitionText()}

Rules:
1. Produce a concise Process Canvas draft, not prose commentary.
2. Populate an element only when it is explicitly stated or reasonably and directly implied by the source description.
3. Prefer leaving an unsupported element empty over inventing information merely to complete the canvas. Do not add something only because it is common or typical in that industry or process domain.
4. Do not fabricate organization names, technologies, laws, standards, partners, costs, revenue streams, environmental effects, social effects, governance arrangements, review mechanisms, or appeal procedures.
5. Avoid named jurisdiction-specific laws or regulations unless the source explicitly identifies them or provides enough context to support them. Do not infer regulations merely because they normally apply to the domain.
6. Purpose expresses the fundamental value the process creates for customers and other beneficiaries.
7. Goals are higher-level operational outcomes the process should consistently achieve, not individual process steps. Normally provide 1–3 concise outcome statements. Do not repeat Key Activities as Goals.
8. Key Activities are the critical actions or stages that define the process flow. Place them in a sensible process order when the source supports an order.
9. Treat Key Partners as external actors. Suppliers provide inputs/services needed to execute the process; enablers facilitate or constrain it without being ordinary suppliers. Do not infer standard industry partners unless the description supports their involvement.
10. Execution capabilities are abilities needed to run the described process. They may be inferred when clearly necessary for the stated activities.
11. Dynamic capabilities are abilities to sense changes, learn, adapt, improve, redesign, or reconfigure the process over time. Populate dynamic capabilities only when the source description indicates such adaptation, learning, monitoring-for-change, or reconfiguration; otherwise leave them empty.
12. Human, physical, and digital resources must be concrete resources required to execute the described process, not activities or capabilities. Infer them only when they are clearly necessary or strongly implied.
13. Customers are the primary beneficiaries. Other Beneficiaries are secondary/indirect beneficiaries and must include a short description of their benefit.
14. Economic costs and benefits should reflect items supported by the description. Do not infer standard revenue sources, fees, pricing models, or cost categories merely from the process type.
15. Environmental and social impacts should be included only when directly supported or strongly implied by the described process. Do not manufacture generic sustainability effects.
16. Responsibility items should describe concrete safeguards, practices, accountability arrangements, or concerns relevant to the process—not generic slogans.
17. Accountability & Contestability requires an identifiable accountability arrangement, review mechanism, challenge/appeal possibility, or means to contest a decision/outcome. A generic support/contact channel alone is not contestability. Leave this field empty if such a mechanism is not supported.
18. Privacy & Security, Fairness & Ethics, and Transparency & Explainability may be populated when the process description clearly entails the corresponding concern, but phrase entries conservatively and avoid inventing specific controls not supported by the source.
19. Keep conceptual categories distinct: do not duplicate the same statement across Goals, Key Activities, Capabilities, Resources, or Responsibility unless the source genuinely supports different aspects.
20. Use short canvas-style phrases. Remove duplicates and near-duplicates.
21. If information is insufficient, use an empty string or empty array as appropriate. Never use placeholders such as "...", "unknown", or "N/A".
22. Return only data conforming to the required JSON schema.`;

  const user = `Create a Process Canvas draft from the following process description:\n\n${source}`;

  return { system, user };
}
