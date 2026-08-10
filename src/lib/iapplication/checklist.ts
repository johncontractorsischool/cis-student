import {
  IAPPLICATION_CHECKLIST_KEYS,
  type IApplicationChecklist,
  type IApplicationChecklistCollection,
  type IApplicationChecklistItems,
} from "./types";

export function emptyChecklistItems(): IApplicationChecklistItems {
  return Object.fromEntries(
    IAPPLICATION_CHECKLIST_KEYS.map((key) => [key, false]),
  ) as IApplicationChecklistItems;
}

export function checklistMap(
  collection: IApplicationChecklistCollection | null,
): Record<string, IApplicationChecklist> {
  return Object.fromEntries(
    (collection?.checklists ?? []).map((checklist) => [
      String(checklist.application_id),
      {
        ...checklist,
        application_id: String(checklist.application_id),
        items: { ...emptyChecklistItems(), ...checklist.items },
      },
    ]),
  );
}

export function emptyChecklist(applicationId: number | string): IApplicationChecklist {
  return {
    application_id: String(applicationId),
    items: emptyChecklistItems(),
    updated_at: null,
  };
}
