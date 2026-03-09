export type Goal = {
  id: string;
  statement: string;
};

export type Customer = {
  id: string;
  name: string;
};

export type OtherBeneficiary = {
  id: string;
  name: string;
  benefitDescription?: string;
};

export type CustomerRelationship = {
  id: string;
  description: string;
};

export type CustomerChannel = {
  id: string;
  description: string;
};

export type KeyActivity = {
  id: string;
  description: string;
};

export type KeyPartnerType = "supplier" | "enabler";

export type KeyPartner = {
  id: string;
  type: KeyPartnerType;
  name: string;
  description?: string;
};

export type KeyCapabilityType = "executionCapability" | "dynamicCapability";

export type KeyCapability = {
  id: string;
  type: KeyCapabilityType;
  description: string;
};

export type KeyPolicyRegulation = {
  id: string;
  name: string;
  description?: string;
};

export type KeyResourceType = "humanResource" | "physicalResource" | "digitalResource";

export type KeyResource = {
  id: string;
  type: KeyResourceType;
  name: string;
  description?: string;
};

export type ValueItem = {
  id: string;
  description: string;
};

export type ResponsibilityPoint = {
  id: string;
  description: string;
};

export type ProcessCanvasBlueprint = {
  meta: {
    id: string;
    name: string;
    version: string;
    createdAt?: string;
    updatedAt?: string;
  };

  goals: Goal[];

  desirability: {
    purpose: string;
    customers: Customer[];
    otherBeneficiaries: OtherBeneficiary[];
    customerRelationships: CustomerRelationship[];
    customerChannels: CustomerChannel[];
  };

  feasibility: {
    keyActivities: KeyActivity[];
    keyPartners: KeyPartner[];
    keyCapabilities: KeyCapability[];
    keyPoliciesRegulations: KeyPolicyRegulation[];
    keyResources: KeyResource[];
  };

  viability: {
    economic: {
      costs: ValueItem[];
      benefits: ValueItem[];
    };
    environmental: {
      negative: ValueItem[];
      positive: ValueItem[];
    };
    social: {
      negative: ValueItem[];
      positive: ValueItem[];
    };
  };

  responsibility: {
    privacySecurity: ResponsibilityPoint[];
    fairnessEthics: ResponsibilityPoint[];
    transparencyExplainability: ResponsibilityPoint[];
    accountabilityContestability: ResponsibilityPoint[];
  };
};

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
};

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeBlankProcessCanvasBlueprint(): ProcessCanvasBlueprint {
  const now = new Date().toISOString();

  return {
    meta: {
      id: makeId("pcb"),
      name: "Untitled Process Canvas",
      version: "1.0.0",
      createdAt: now,
      updatedAt: now,
    },

    goals: [{ id: makeId("goal"), statement: "Click to edit" }],

    desirability: {
      purpose: "Click to edit",
      customers: [{ id: makeId("cust"), name: "Click to edit" }],
      otherBeneficiaries: [],
      customerRelationships: [],
      customerChannels: [],
    },

    feasibility: {
      keyActivities: [{ id: makeId("act"), description: "Click to edit" }],
      keyPartners: [],
      keyCapabilities: [],
      keyPoliciesRegulations: [],
      keyResources: [],
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

export function deepClonePCB(bp: ProcessCanvasBlueprint): ProcessCanvasBlueprint {
  return JSON.parse(JSON.stringify(bp)) as ProcessCanvasBlueprint;
}

export function validateProcessCanvasBlueprint(bp: ProcessCanvasBlueprint): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!bp.meta.name.trim()) {
    issues.push({ level: "warning", message: "Blueprint name is empty." });
  }

  if (!bp.desirability.purpose.trim()) {
    issues.push({ level: "warning", message: "Purpose is empty." });
  }

  if (bp.goals.length === 0) {
    issues.push({ level: "warning", message: "At least one Goal is recommended." });
  }

  if (bp.desirability.customers.length === 0) {
    issues.push({ level: "warning", message: "At least one Customer is recommended." });
  }

  if (bp.feasibility.keyActivities.length === 0) {
    issues.push({ level: "warning", message: "At least one Key Activity is recommended." });
  }

  return issues;
}