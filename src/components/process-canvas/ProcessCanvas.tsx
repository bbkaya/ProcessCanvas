import { type CSSProperties } from "react";
import { PROCESS_CANVAS_LAYOUT_V1 } from "../../processCanvas/processCanvasLayout";
import type {
  Customer,
  CustomerChannel,
  CustomerRelationship,
  Goal,
  KeyActivity,
  KeyCapability,
  KeyPartner,
  KeyPolicyRegulation,
  KeyResource,
  ProcessCanvasBlueprint,
  ResponsibilityPoint,
  ValueItem,
} from "../../processCanvas/processCanvasDomain";

type Props = {
  blueprint: ProcessCanvasBlueprint;
  onChange: (next: ProcessCanvasBlueprint) => void;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sectionTitle(title: string) {
  return <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>;
}

function boxStyle(base?: CSSProperties): CSSProperties {
  return {
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    ...base,
  };
}

function textareaStyle(dark = false, centered = false): CSSProperties {
  return {
    width: "100%",
    minHeight: 84,
    resize: "vertical",
    border: "none",
    outline: "none",
    background: "transparent",
    color: dark ? "#fff" : "#000",
    font: "inherit",
    textAlign: centered ? "center" : "left",
    lineHeight: 1.35,
  };
}

function inputStyle(dark = false): CSSProperties {
  return {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: dark ? "#fff" : "#000",
    font: "inherit",
    lineHeight: 1.35,
  };
}

function buttonStyle(dark = false): CSSProperties {
  return {
    border: `1px solid ${dark ? "rgba(255,255,255,0.65)" : "#999"}`,
    background: "transparent",
    color: dark ? "#fff" : "#222",
    padding: "2px 8px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  };
}

function listRowStyle(): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "start",
    marginBottom: 6,
  };
}

function updateListItem<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function removeIndex<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

function renderSimpleBulletList<T extends { id: string }>(
  title: string,
  items: T[],
  getValue: (item: T) => string,
  setValue: (item: T, value: string) => T,
  addItem: () => T,
  onChange: (next: T[]) => void,
  dark = false
) {
  return (
    <div style={{ height: "100%" }}>
      {sectionTitle(title)}
      <div>
        {items.map((item, index) => (
          <div key={item.id} style={listRowStyle()}>
            <div style={{ display: "grid", gridTemplateColumns: "14px 1fr", gap: 6 }}>
              <div style={{ paddingTop: 5 }}>•</div>
              <input
                value={getValue(item)}
                onChange={(e) => onChange(updateListItem(items, index, setValue(item, e.target.value)))}
                style={inputStyle(dark)}
              />
            </div>
            <button type="button" style={buttonStyle(dark)} onClick={() => onChange(removeIndex(items, index))}>
              −
            </button>
          </div>
        ))}
      </div>
      <button type="button" style={buttonStyle(dark)} onClick={() => onChange([...items, addItem()])}>
        + Add
      </button>
    </div>
  );
}

function renderTypedListGroups<T extends { id: string; type: string }>(
  title: string,
  groups: Array<{
    key: string;
    label: string;
    makeItem: () => T;
    getText: (item: T) => string;
    setText: (item: T, value: string) => T;
  }>,
  items: T[],
  onChange: (next: T[]) => void,
  dark = false
) {
  return (
    <div>
      {sectionTitle(title)}
      {groups.map((group) => {
        const groupItems = items.filter((x) => x.type === group.key);
        return (
          <div key={group.key} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{group.label}</div>
            {groupItems.map((item) => {
              const index = items.findIndex((x) => x.id === item.id);
              return (
                <div key={item.id} style={listRowStyle()}>
                  <div style={{ display: "grid", gridTemplateColumns: "14px 1fr", gap: 6 }}>
                    <div style={{ paddingTop: 5 }}>•</div>
                    <input
                      value={group.getText(item)}
                      onChange={(e) =>
                        onChange(updateListItem(items, index, group.setText(item, e.target.value)))
                      }
                      style={inputStyle(dark)}
                    />
                  </div>
                  <button type="button" style={buttonStyle(dark)} onClick={() => onChange(removeIndex(items, index))}>
                    −
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              style={buttonStyle(dark)}
              onClick={() => onChange([...items, group.makeItem()])}
            >
              + Add {group.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ProcessCanvas({ blueprint, onChange }: Props) {
  const layout = PROCESS_CANVAS_LAYOUT_V1;

  const update = (mutator: (draft: ProcessCanvasBlueprint) => void) => {
    const next = clone(blueprint);
    mutator(next);
    next.meta.updatedAt = new Date().toISOString();
    onChange(next);
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: layout.columnWidths.join(" "),
    gridTemplateRows: layout.rowHeights.join(" "),
    width: "100%",
    minWidth: 1200,
    border: "1px solid #000",
    background: "#fff",
  };

  const getBlockContent = (id: string) => {
    switch (id) {
      case "responsibilityHeader":
      case "feasibilitySide":
      case "desirabilitySide":
      case "viabilityFooter":
      case "economicCenter":
      case "envCenter":
      case "socialCenter":
        return <div>{layout.blocks.find((b) => b.id === id)?.label}</div>;

      case "purpose":
        return (
          <div>
            {sectionTitle("Purpose")}
            <textarea
              value={blueprint.desirability.purpose}
              onChange={(e) =>
                update((d) => {
                  d.desirability.purpose = e.target.value;
                })
              }
              style={textareaStyle(true, true)}
            />
          </div>
        );

      case "goal":
        return renderSimpleBulletList<Goal>(
          "Goal",
          blueprint.goals,
          (x) => x.statement,
          (x, value) => ({ ...x, statement: value }),
          () => ({ id: makeId("goal"), statement: "" }),
          (next) =>
            update((d) => {
              d.goals = next;
            }),
          false
        );

      case "customers":
        return renderSimpleBulletList<Customer>(
          "Customers",
          blueprint.desirability.customers,
          (x) => x.name,
          (x, value) => ({ ...x, name: value }),
          () => ({ id: makeId("cust"), name: "" }),
          (next) =>
            update((d) => {
              d.desirability.customers = next;
            }),
          true
        );

      case "otherBeneficiaries":
        return (
          <div>
            {sectionTitle("Other Beneficiaries")}
            {blueprint.desirability.otherBeneficiaries.map((item, index) => (
              <div key={item.id} style={listRowStyle()}>
                <div style={{ display: "grid", gridTemplateColumns: "14px 1fr", gap: 6 }}>
                  <div style={{ paddingTop: 5 }}>•</div>
                  <input
                    value={
                      item.benefitDescription?.trim()
                        ? `${item.name} (${item.benefitDescription})`
                        : item.name
                    }
                    onChange={(e) =>
                      update((d) => {
                        const raw = e.target.value;
                        const match = raw.match(/^(.+?)\s*\((.*)\)\s*$/);
                        d.desirability.otherBeneficiaries[index] = match
                          ? {
                              ...item,
                              name: match[1].trim(),
                              benefitDescription: match[2].trim(),
                            }
                          : { ...item, name: raw, benefitDescription: "" };
                      })
                    }
                    style={inputStyle(true)}
                  />
                </div>
                <button
                  type="button"
                  style={buttonStyle(true)}
                  onClick={() =>
                    update((d) => {
                      d.desirability.otherBeneficiaries = removeIndex(
                        d.desirability.otherBeneficiaries,
                        index
                      );
                    })
                  }
                >
                  −
                </button>
              </div>
            ))}
            <button
              type="button"
              style={buttonStyle(true)}
              onClick={() =>
                update((d) => {
                  d.desirability.otherBeneficiaries.push({
                    id: makeId("benef"),
                    name: "",
                    benefitDescription: "",
                  });
                })
              }
            >
              + Add
            </button>
          </div>
        );

      case "customerRelationship":
        return renderSimpleBulletList<CustomerRelationship>(
          "Customer Relationship",
          blueprint.desirability.customerRelationships,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("rel"), description: "" }),
          (next) =>
            update((d) => {
              d.desirability.customerRelationships = next;
            }),
          true
        );

      case "customerChannels":
        return renderSimpleBulletList<CustomerChannel>(
          "Customer Channels",
          blueprint.desirability.customerChannels,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("chan"), description: "" }),
          (next) =>
            update((d) => {
              d.desirability.customerChannels = next;
            }),
          true
        );

      case "keyActivities":
        return renderSimpleBulletList<KeyActivity>(
          "Key Activities",
          blueprint.feasibility.keyActivities,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("act"), description: "" }),
          (next) =>
            update((d) => {
              d.feasibility.keyActivities = next;
            }),
          true
        );

      case "keyPoliciesRegulations":
        return renderSimpleBulletList<KeyPolicyRegulation>(
          "Key Policies & Regulations",
          blueprint.feasibility.keyPoliciesRegulations,
          (x) => (x.description?.trim() ? `${x.name} (${x.description})` : x.name),
          (x, value) => {
            const match = value.match(/^(.+?)\s*\((.*)\)\s*$/);
            return match
              ? { ...x, name: match[1].trim(), description: match[2].trim() }
              : { ...x, name: value, description: "" };
          },
          () => ({ id: makeId("pol"), name: "", description: "" }),
          (next) =>
            update((d) => {
              d.feasibility.keyPoliciesRegulations = next;
            }),
          true
        );

      case "keyPartners":
        return renderTypedListGroups<KeyPartner>(
          "Key Partners",
          [
            {
              key: "supplier",
              label: "Suppliers",
              makeItem: () => ({ id: makeId("partner"), type: "supplier", name: "" }),
              getText: (x) => x.name,
              setText: (x, value) => ({ ...x, name: value }),
            },
            {
              key: "enabler",
              label: "Enablers",
              makeItem: () => ({ id: makeId("partner"), type: "enabler", name: "" }),
              getText: (x) => x.name,
              setText: (x, value) => ({ ...x, name: value }),
            },
          ],
          blueprint.feasibility.keyPartners,
          (next) =>
            update((d) => {
              d.feasibility.keyPartners = next;
            }),
          true
        );

      case "keyCapabilities":
        return renderTypedListGroups<KeyCapability>(
          "Key Capabilities",
          [
            {
              key: "executionCapability",
              label: "Execution Capabilities",
              makeItem: () => ({
                id: makeId("cap"),
                type: "executionCapability",
                description: "",
              }),
              getText: (x) => x.description,
              setText: (x, value) => ({ ...x, description: value }),
            },
            {
              key: "dynamicCapability",
              label: "Dynamic Capabilities",
              makeItem: () => ({
                id: makeId("cap"),
                type: "dynamicCapability",
                description: "",
              }),
              getText: (x) => x.description,
              setText: (x, value) => ({ ...x, description: value }),
            },
          ],
          blueprint.feasibility.keyCapabilities,
          (next) =>
            update((d) => {
              d.feasibility.keyCapabilities = next;
            }),
          true
        );

      case "keyResources":
        return renderTypedListGroups<KeyResource>(
          "Key Resources",
          [
            {
              key: "humanResource",
              label: "Human",
              makeItem: () => ({ id: makeId("res"), type: "humanResource", name: "" }),
              getText: (x) => x.name,
              setText: (x, value) => ({ ...x, name: value }),
            },
            {
              key: "physicalResource",
              label: "Physical",
              makeItem: () => ({ id: makeId("res"), type: "physicalResource", name: "" }),
              getText: (x) => x.name,
              setText: (x, value) => ({ ...x, name: value }),
            },
            {
              key: "digitalResource",
              label: "Digital",
              makeItem: () => ({ id: makeId("res"), type: "digitalResource", name: "" }),
              getText: (x) => x.name,
              setText: (x, value) => ({ ...x, name: value }),
            },
          ],
          blueprint.feasibility.keyResources,
          (next) =>
            update((d) => {
              d.feasibility.keyResources = next;
            }),
          true
        );

      case "economicCosts":
        return renderSimpleBulletList<ValueItem>(
          "Direct financial Costs",
          blueprint.viability.economic.costs,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("cost"), description: "" }),
          (next) =>
            update((d) => {
              d.viability.economic.costs = next;
            }),
          true
        );

      case "economicBenefits":
        return renderSimpleBulletList<ValueItem>(
          "Direct financial Benefits",
          blueprint.viability.economic.benefits,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("ben"), description: "" }),
          (next) =>
            update((d) => {
              d.viability.economic.benefits = next;
            }),
          true
        );

      case "envNegative":
        return renderSimpleBulletList<ValueItem>(
          "Negative Environmental impacts",
          blueprint.viability.environmental.negative,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("envn"), description: "" }),
          (next) =>
            update((d) => {
              d.viability.environmental.negative = next;
            }),
          true
        );

      case "envPositive":
        return renderSimpleBulletList<ValueItem>(
          "Positive Environmental impacts",
          blueprint.viability.environmental.positive,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("envp"), description: "" }),
          (next) =>
            update((d) => {
              d.viability.environmental.positive = next;
            }),
          true
        );

      case "socialNegative":
        return renderSimpleBulletList<ValueItem>(
          "Negative Social impacts",
          blueprint.viability.social.negative,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("socn"), description: "" }),
          (next) =>
            update((d) => {
              d.viability.social.negative = next;
            }),
          true
        );

      case "socialPositive":
        return renderSimpleBulletList<ValueItem>(
          "Positive Social impacts",
          blueprint.viability.social.positive,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("socp"), description: "" }),
          (next) =>
            update((d) => {
              d.viability.social.positive = next;
            }),
          true
        );

      case "privacySecurity":
        return renderSimpleBulletList<ResponsibilityPoint>(
          "Privacy & Security",
          blueprint.responsibility.privacySecurity,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("priv"), description: "" }),
          (next) =>
            update((d) => {
              d.responsibility.privacySecurity = next;
            }),
          false
        );

      case "fairnessEthics":
        return renderSimpleBulletList<ResponsibilityPoint>(
          "Fairness & Ethics",
          blueprint.responsibility.fairnessEthics,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("fair"), description: "" }),
          (next) =>
            update((d) => {
              d.responsibility.fairnessEthics = next;
            }),
          false
        );

      case "transparencyExplainability":
        return renderSimpleBulletList<ResponsibilityPoint>(
          "Transparency & Explainability",
          blueprint.responsibility.transparencyExplainability,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("tran"), description: "" }),
          (next) =>
            update((d) => {
              d.responsibility.transparencyExplainability = next;
            }),
          false
        );

      case "accountabilityContestability":
        return renderSimpleBulletList<ResponsibilityPoint>(
          "Accountability & Contestability",
          blueprint.responsibility.accountabilityContestability,
          (x) => x.description,
          (x, value) => ({ ...x, description: value }),
          () => ({ id: makeId("acct"), description: "" }),
          (next) =>
            update((d) => {
              d.responsibility.accountabilityContestability = next;
            }),
          false
        );

      default:
        return <div>{id}</div>;
    }
  };

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <div id="process-canvas-export-root" style={gridStyle}>
        {layout.blocks.map((block) => {
          const style: CSSProperties = {
            ...boxStyle({
              background: block.style.backgroundColor,
              color: block.style.color,
              textAlign: block.style.textAlign,
              verticalAlign: block.style.verticalAlign,
              border: block.style.border,
              padding: block.style.padding,
              fontStyle: block.style.fontStyle,
              fontWeight: block.style.fontWeight,
              fontSize: block.style.fontSize ?? 13,
            }),
            gridColumn: `${block.col} / span ${block.colSpan}`,
            gridRow: `${block.row} / span ${block.rowSpan}`,
          };

          return (
            <div key={block.id} style={style}>
              {getBlockContent(block.id)}
            </div>
          );
        })}
      </div>
    </div>
  );
}