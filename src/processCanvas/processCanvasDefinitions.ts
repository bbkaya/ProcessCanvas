export type ProcessCanvasHelpContent = {
  title: string;
  question: string;
  examples?: string[];
  subgroups?: Array<{ label: string; examples: string[] }>;
};

/**
 * Authoritative semantic definitions used by both the editor Help panel and
 * the AI-assisted creation flow. Keep conceptual changes here so the UI and AI
 * interpretation stay aligned.
 */
export const PROCESS_CANVAS_HELP_CONTENT: Record<string, ProcessCanvasHelpContent> = {
  purposeGoals: {
    title: "Purpose & Goals",
    question:
      "Purpose: What fundamental value does this process create for its customers and other beneficiaries? --- Goals: What operational outcomes should it deliver consistently?",
    subgroups: [
      {
        label: "Purpose",
        examples: [
          "Enable seamless green mobility for every city commuter",
          "Enable responsible and accessible financing for individuals",
        ],
      },
      {
        label: "Goals",
        examples: [
          "Balance availability, accessibility, and reliability of e-bikes while maintaining a frictionless and cost-effective travel experience",
          "Process applications efficiently, assess risk, and disburse loans to eligible customers while ensuring compliance",
        ],
      },
    ],
  },
  keyActivities: {
    title: "Key Activities",
    question: "What are the critical steps that define the flow of this process?",
    examples: [
      "Verify identity",
      "Locate available e-bikes and reserve",
      "Unlock the e-bike via the app",
      "Ride to the destination and leave the vehicle in a designated zone",
    ],
  },
  customers: {
    title: "Customers",
    question: "Who are the main beneficiaries of the value that the process creates?",
    examples: [
      "Traveler for a shared micromobility journey",
      "Retail customers seeking personal loans, mortgages, auto loans, or student loans",
    ],
  },
  otherBeneficiaries: {
    title: "Other Beneficiaries",
    question: "Who besides the primary customer benefits indirectly from this process, and in what way?",
    examples: [
      "Municipality through reduced congestion and better mobility access",
      "Investors, credit bureaus, and financial data providers in loan processing",
    ],
  },
  customerRelationship: {
    title: "Customer Relationship",
    question: "How does the process interact with and support customers throughout their journey?",
    examples: [
      "Self-service and automated decision-making",
      "Human support for complex cases",
      "Personalized assisted advisory",
    ],
  },
  customerChannels: {
    title: "Customer Channels",
    question: "How do customers access, initiate, or receive updates about the process?",
    examples: ["Online banking", "Mobile app", "Bank branch visits", "Phone and video calls"],
  },
  keyPartners: {
    title: "Key Partners",
    question: "Which external actors contribute to or enable this process?",
    subgroups: [
      {
        label: "Suppliers",
        examples: [
          "Maintenance providers",
          "Mobile app developers",
          "GPS tracking providers",
          "Payment gateway providers",
        ],
      },
      {
        label: "Enablers",
        examples: ["Municipality", "Public transport authority", "Certification or standards bodies"],
      },
    ],
  },
  keyCapabilities: {
    title: "Key Capabilities",
    question: "Which capabilities are needed to execute and adapt this process?",
    subgroups: [
      {
        label: "Execution Capabilities",
        examples: [
          "Booking",
          "Unlocking",
          "Riding",
          "Issue reporting",
          "Customer support",
          "Billing and payment",
        ],
      },
      {
        label: "Dynamic Capabilities",
        examples: [
          "Detect shifts in user demand or regulation",
          "Rebalance fleet size in high-demand areas",
          "Integrate predictive maintenance or new digital features",
        ],
      },
    ],
  },
  keyPoliciesRegulations: {
    title: "Key Policies & Regulations",
    question: "What laws, standards, regulatory bodies, and organizational policies govern this process?",
    examples: [
      "Age restrictions",
      "Parking zone regulations",
      "Ride-time limits",
      "Subsidy rules",
      "GDPR and security requirements",
    ],
  },
  keyResources: {
    title: "Key Resources",
    question: "What human, physical, and digital resources are essential for executing this process?",
    subgroups: [
      {
        label: "Human",
        examples: [
          "Service operators",
          "Maintenance teams",
          "Customer support",
          "Data analysts",
          "Municipality liaisons",
        ],
      },
      {
        label: "Physical",
        examples: ["E-bikes", "Repair centres", "Charging infrastructure", "IoT-connected smart locks"],
      },
      {
        label: "Digital",
        examples: ["Mobile app", "GPS tracking system", "Payment gateway", "Customer data analytics"],
      },
    ],
  },
  economicCosts: {
    title: "Economic Viability — Costs",
    question: "What cost items or negative economic effects are associated with this process?",
    examples: ["Charging", "Issue fixing", "Insurance", "Operational support"],
  },
  economicBenefits: {
    title: "Economic Viability — Benefits",
    question: "What revenue streams or positive economic effects are associated with this process?",
    examples: ["Pay-per-use payments", "Subscriptions", "Service fees"],
  },
  envNegative: {
    title: "Environmental Viability — Negative",
    question: "What negative environmental impacts does the process create?",
    examples: ["Energy used for charging", "Battery replacement impact", "Rebalancing vehicle emissions"],
  },
  envPositive: {
    title: "Environmental Viability — Positive",
    question: "What positive environmental impacts does the process create?",
    examples: ["Reduced car traffic", "Lower emissions", "Better use of shared assets"],
  },
  socialNegative: {
    title: "Social Viability — Negative",
    question: "What negative social impacts can arise from this process?",
    examples: ["Competition with public transportation", "Obstructed sidewalks", "Increased accident risk"],
  },
  socialPositive: {
    title: "Social Viability — Positive",
    question: "What positive social impacts can arise from this process?",
    examples: ["Convenience and wellness for travelers", "Improved urban liveability", "Better accessibility"],
  },
  privacySecurity: {
    title: "Privacy & Security",
    question: "How does the process protect sensitive data, comply with regulation, and mitigate security risks?",
    examples: ["Anonymized trip data", "GDPR compliance", "Secure payments", "Fraud prevention"],
  },
  fairnessEthics: {
    title: "Fairness & Ethics",
    question: "How does the process ensure fairness, inclusivity, and ethical decision-making?",
    examples: ["Fair pricing", "Inclusive service access", "Age checks", "Internationalization"],
  },
  transparencyExplainability: {
    title: "Transparency & Explainability",
    question: "How are process decisions transparent, understandable, and accessible to stakeholders?",
    examples: [
      "Detailed cost breakdown before booking",
      "Transparent complaint handling",
      "Periodic reports on reliability and sustainability impact",
    ],
  },
  accountabilityContestability: {
    title: "Accountability & Contestability",
    question: "Who is accountable for outcomes, and how can customers or stakeholders challenge decisions?",
    examples: [
      "Clear accountability for pricing, availability, maintenance, and disputes",
      "Municipality oversight for safety and public-space compliance",
      "App-based contestation with supporting evidence such as photos",
    ],
  },
};

/**
 * Converts the same definitions shown in the editor into compact textual
 * guidance suitable for an LLM system prompt.
 */
export function buildProcessCanvasDefinitionText(): string {
  return Object.values(PROCESS_CANVAS_HELP_CONTENT)
    .map((item) => {
      const subgroupText = item.subgroups?.length
        ? ` Subcategories: ${item.subgroups.map((group) => group.label).join(", ")}.`
        : "";
      return `- ${item.title}: ${item.question}${subgroupText}`;
    })
    .join("\n");
}
