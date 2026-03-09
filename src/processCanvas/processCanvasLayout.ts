export type PCDimension =
  | "meta"
  | "desirability"
  | "feasibility"
  | "viability"
  | "responsibility";

export type PCCellStyle = {
  backgroundColor?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  border?: string;
  padding?: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: number;
  fontSize?: string;
};

export type PCCanvasBlock = {
  id: string;
  label: string;
  prompt?: string;
  dimension: PCDimension;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  style: PCCellStyle;
};

export type PCCanvasLayout = {
  id: string;
  name: string;
  columnCount: number;
  rowCount: number;
  columnWidths: string[];
  rowHeights: string[];
  blocks: PCCanvasBlock[];
};

const WHITE = "#ffffff";
const DARK_BLUE = "#0d4678";
const MID_BLUE = "#63b3da";
const LIGHT_BLUE = "#87aac6";
const GREY = "#9ea1a3";
const BLACK = "#000000";

export const PROCESS_CANVAS_LAYOUT_V1: PCCanvasLayout = {
  id: "process-canvas-v1",
  name: "Process Canvas",
  columnCount: 10,
  rowCount: 10,
  columnWidths: [
    "34px",
    "1fr",
    "1fr",
    "1fr",
    "0.85fr",
    "0.85fr",
    "1fr",
    "1fr",
    "1fr",
    "34px",
  ],
  rowHeights: [
    "34px",
    "140px",
    "160px",
    "160px",
    "150px",
    "100px",
    "86px",
    "86px",
    "86px",
    "34px",
  ],
  blocks: [
    {
      id: "responsibilityHeader",
      label: "RESPONSIBILITY",
      dimension: "responsibility",
      row: 1,
      col: 2,
      rowSpan: 1,
      colSpan: 8,
      style: {
        backgroundColor: WHITE,
        color: MID_BLUE,
        textAlign: "center",
        verticalAlign: "middle",
        fontStyle: "italic",
        fontWeight: 700,
        border: "1px solid #000",
        padding: "6px",
      },
    },

    {
      id: "feasibilitySide",
      label: "FEASIBILITY",
      dimension: "feasibility",
      row: 2,
      col: 1,
      rowSpan: 8,
      colSpan: 1,
      style: {
        backgroundColor: WHITE,
        color: DARK_BLUE,
        textAlign: "center",
        verticalAlign: "middle",
        fontStyle: "italic",
        fontWeight: 700,
        border: "1px solid #000",
        padding: "4px",
      },
    },
    {
      id: "desirabilitySide",
      label: "DESIRABILITY",
      dimension: "desirability",
      row: 2,
      col: 10,
      rowSpan: 8,
      colSpan: 1,
      style: {
        backgroundColor: WHITE,
        color: GREY,
        textAlign: "center",
        verticalAlign: "middle",
        fontStyle: "italic",
        fontWeight: 700,
        border: "1px solid #000",
        padding: "4px",
      },
    },

    {
      id: "privacySecurity",
      label: "Privacy & Security",
      dimension: "responsibility",
      row: 2,
      col: 2,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: MID_BLUE,
        color: BLACK,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
        fontWeight: 700,
      },
    },
    {
      id: "fairnessEthics",
      label: "Fairness & Ethics",
      dimension: "responsibility",
      row: 2,
      col: 4,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: MID_BLUE,
        color: BLACK,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
        fontWeight: 700,
      },
    },
    {
      id: "transparencyExplainability",
      label: "Transparency & Explainability",
      dimension: "responsibility",
      row: 2,
      col: 6,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: MID_BLUE,
        color: BLACK,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
        fontWeight: 700,
      },
    },
    {
      id: "accountabilityContestability",
      label: "Accountability & Contestability",
      dimension: "responsibility",
      row: 2,
      col: 8,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: MID_BLUE,
        color: BLACK,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
        fontWeight: 700,
      },
    },

    {
      id: "keyPartners",
      label: "Key Partners",
      dimension: "feasibility",
      row: 3,
      col: 2,
      rowSpan: 2,
      colSpan: 1,
      style: {
        backgroundColor: DARK_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "keyCapabilities",
      label: "Key Capabilities",
      dimension: "feasibility",
      row: 3,
      col: 3,
      rowSpan: 2,
      colSpan: 2,
      style: {
        backgroundColor: DARK_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "purpose",
      label: "Purpose",
      dimension: "desirability",
      row: 3,
      col: 5,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: GREY,
        color: WHITE,
        textAlign: "center",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "customerRelationship",
      label: "Customer Relationship",
      dimension: "desirability",
      row: 3,
      col: 7,
      rowSpan: 2,
      colSpan: 2,
      style: {
        backgroundColor: GREY,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "customers",
      label: "Customers",
      dimension: "desirability",
      row: 3,
      col: 9,
      rowSpan: 2,
      colSpan: 1,
      style: {
        backgroundColor: GREY,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },

    {
      id: "goal",
      label: "Goal",
      dimension: "meta",
      row: 4,
      col: 5,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: WHITE,
        color: BLACK,
        textAlign: "center",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },

    {
      id: "keyPoliciesRegulations",
      label: "Key Policies & Regulations",
      dimension: "feasibility",
      row: 5,
      col: 2,
      rowSpan: 1,
      colSpan: 1,
      style: {
        backgroundColor: DARK_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "keyResources",
      label: "Key Resources",
      dimension: "feasibility",
      row: 5,
      col: 3,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: DARK_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "keyActivities",
      label: "Key Activities",
      dimension: "feasibility",
      row: 5,
      col: 5,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: DARK_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "customerChannels",
      label: "Customer Channels",
      dimension: "desirability",
      row: 5,
      col: 7,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: GREY,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "otherBeneficiaries",
      label: "Other Beneficiaries",
      dimension: "desirability",
      row: 5,
      col: 9,
      rowSpan: 1,
      colSpan: 1,
      style: {
        backgroundColor: GREY,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },

    {
      id: "economicCosts",
      label: "Direct financial Costs",
      dimension: "viability",
      row: 7,
      col: 2,
      rowSpan: 1,
      colSpan: 3,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "economicCenter",
      label: "Economic Viability",
      dimension: "viability",
      row: 7,
      col: 5,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "center",
        verticalAlign: "middle",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "economicBenefits",
      label: "Direct financial Benefits",
      dimension: "viability",
      row: 7,
      col: 7,
      rowSpan: 1,
      colSpan: 3,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "right",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },

    {
      id: "envNegative",
      label: "Negative Environmental impacts",
      dimension: "viability",
      row: 8,
      col: 2,
      rowSpan: 1,
      colSpan: 3,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "envCenter",
      label: "Environmental Viability",
      dimension: "viability",
      row: 8,
      col: 5,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "center",
        verticalAlign: "middle",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "envPositive",
      label: "Positive Environmental impacts",
      dimension: "viability",
      row: 8,
      col: 7,
      rowSpan: 1,
      colSpan: 3,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "right",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },

    {
      id: "socialNegative",
      label: "Negative Social impacts",
      dimension: "viability",
      row: 9,
      col: 2,
      rowSpan: 1,
      colSpan: 3,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "left",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "socialCenter",
      label: "Social Viability",
      dimension: "viability",
      row: 9,
      col: 5,
      rowSpan: 1,
      colSpan: 2,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "center",
        verticalAlign: "middle",
        border: "1px solid #000",
        padding: "8px",
      },
    },
    {
      id: "socialPositive",
      label: "Positive Social impacts",
      dimension: "viability",
      row: 9,
      col: 7,
      rowSpan: 1,
      colSpan: 3,
      style: {
        backgroundColor: LIGHT_BLUE,
        color: WHITE,
        textAlign: "right",
        verticalAlign: "top",
        border: "1px solid #000",
        padding: "8px",
      },
    },

    {
      id: "viabilityFooter",
      label: "VIABILITY",
      dimension: "viability",
      row: 10,
      col: 2,
      rowSpan: 1,
      colSpan: 8,
      style: {
        backgroundColor: WHITE,
        color: "#6f8ea7",
        textAlign: "center",
        verticalAlign: "middle",
        fontStyle: "italic",
        fontWeight: 700,
        border: "1px solid #000",
        padding: "6px",
      },
    },
  ],
};