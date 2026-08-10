import { describe, expect, it } from "vitest";

import { checklistMap, emptyChecklist, emptyChecklistItems } from "./checklist";

describe("iApplication readiness checklists", () => {
  it("defaults every supported item to false", () => {
    expect(emptyChecklistItems()).toEqual({
      applicant_signature: false,
      qualifier_signature: false,
      notary_acknowledgment: false,
      officer_partner_signatures: false,
      records_copy: false,
      supporting_documents: false,
      application_fee_payment: false,
      certified_mail: false,
    });
  });

  it("keeps application checklists independent", () => {
    const checklists = checklistMap({
      checklists: [
        {
          application_id: "11",
          items: { ...emptyChecklistItems(), applicant_signature: true },
          updated_at: null,
        },
        {
          application_id: "22",
          items: { ...emptyChecklistItems(), certified_mail: true },
          updated_at: null,
        },
      ],
    });

    checklists["11"].items.records_copy = true;

    expect(checklists["11"].items.applicant_signature).toBe(true);
    expect(checklists["22"].items.applicant_signature).toBe(false);
    expect(checklists["22"].items.records_copy).toBe(false);
    expect(checklists["22"].items.certified_mail).toBe(true);
  });

  it("creates independent empty application records", () => {
    const first = emptyChecklist(11);
    const second = emptyChecklist(22);
    first.items.applicant_signature = true;

    expect(first.application_id).toBe("11");
    expect(second.application_id).toBe("22");
    expect(second.items.applicant_signature).toBe(false);
  });
});
