import type { ContractFormProduct } from "@/lib/contract-forms/types";

export const CONTRACT_FORM_PRODUCTS: readonly ContractFormProduct[] = [
  {
    id: "home-improvement-agreement",
    title: "Home Improvement Agreement (QTY 50)",
    pickerLabel: "Home Improvement (QTY 50)",
    variantId: "47189340749955",
    price: 30,
    type: "PHYSICAL",
    previewLabel: "Contract",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Home_Improvement_Agreement_Form.png?v=1783372311",
    description: [
      "A comprehensive agreement for residential construction and remodeling projects that clearly outlines the work, responsibilities, pricing, and project terms.",
      "Includes project scope, materials, dates, contract price, down payment, finance charges, and progress payment schedule sections.",
    ],
    notice:
      "Designed for California home improvement projects and intended to be used with applicable companion notices and disclosure forms when required by law.",
  },
  {
    id: "home-improvement-agreement-scope",
    title: "Home Improvement Agreement - Scope of Work Continued (QTY 50)",
    pickerLabel: "Scope of Work (QTY 50)",
    variantId: "47189385150595",
    price: 15,
    type: "PHYSICAL",
    previewLabel: "Scope",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Home_improvement_Agreement_-_Continuation_aa514615-4740-4862-b833-5e109d17da86.png?v=1783372487",
    description: [
      "Provides additional space to describe labor, materials, specifications, project phases, and other important details.",
      "Ideal for projects requiring a more detailed scope of work.",
    ],
    notice:
      "This form supplements the Home Improvement Contract Form and is not intended to be used as a standalone contract.",
  },
  {
    id: "three-day-right-to-cancel",
    title: "Notice of Three-Day Right to Cancel Form (QTY 50)",
    pickerLabel: "3-Day Cancel (QTY 50)",
    variantId: "47189499281539",
    price: 25,
    type: "PHYSICAL",
    previewLabel: "3 Day",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Notice_of_Three_Day_Right_to_Cancel.png?v=1783372439",
    description: [
      "Notice form for projects requiring a Three-Day Right to Cancel disclosure.",
      "Prepared as a companion disclosure for qualifying contractor transactions.",
    ],
    notice:
      "Contractors are responsible for determining when this notice applies and for complying with applicable cancellation notice rules.",
  },
  {
    id: "five-day-right-to-cancel",
    title: "Notice of Five-Day Right to Cancel (QTY 25)",
    pickerLabel: "5-Day Cancel (QTY 25)",
    variantId: "47189500821635",
    price: 20,
    type: "PHYSICAL",
    previewLabel: "5 Day",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Notice_of_Five_Day_Right_to_Cancel.png?v=1783372423",
    description: [
      "Notice form for qualifying senior citizen cancellation disclosures.",
      "Provides a companion notice for projects where the five-day cancellation period applies.",
    ],
    notice:
      "Contractors should verify eligibility and use this form only when the five-day cancellation notice is required.",
  },
  {
    id: "seven-day-right-to-cancel",
    title: "Notice of Seven-Day Right to Cancel Form (QTY 25)",
    pickerLabel: "7-Day Cancel (QTY 25)",
    variantId: "47189510520963",
    price: 20,
    type: "PHYSICAL",
    previewLabel: "7 Day",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Notice_of_Seven_Day_Right_To_Cancel.png?v=1783372404",
    description: [
      "Notice form for transactions requiring a Seven-Day Right to Cancel disclosure.",
      "Helps provide required cancellation language as a companion form to the contract package.",
    ],
    notice:
      "Use this notice only when applicable cancellation rules require a seven-day right to cancel.",
  },
  {
    id: "service-repair-contract",
    title: "Service and Repair Contract Form (QTY 25)",
    pickerLabel: "Service & Repair (QTY 25)",
    variantId: "47189534441603",
    price: 20,
    type: "PHYSICAL",
    previewLabel: "Repair",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Service_and_Repair_Contract.png?v=1783372381",
    description: [
      "Designed for qualifying residential service, repair, and maintenance work that does not require a Home Improvement Contract.",
      "Documents work to be performed, pricing, payment terms, and customer authorization before work begins.",
    ],
    notice:
      "California law limits when a Service & Repair Contract may be used, including price and customer-request conditions.",
  },
  {
    id: "change-order-work-notice",
    title: "Performance of Extra or Change-Order Work Notice Form (QTY 50)",
    pickerLabel: "Change Order (QTY 50)",
    variantId: "47189544337539",
    price: 28,
    type: "PHYSICAL",
    previewLabel: "Change",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Extra_or_Change_Order_Work_Notice.png?v=1783372353",
    description: [
      "Documents additional work or changes requested after the original contract has been signed.",
      "Helps identify changes to scope, materials, pricing, or project schedule before extra or changed work is performed.",
    ],
    notice:
      "Changes to the original contract should generally be documented in writing and signed by both the contractor and customer before work is performed.",
  },
  {
    id: "workers-comp-liability-notice",
    title: "Workers' Compensation & Liability Insurance Notice Form (QTY 50)",
    pickerLabel: "Workers Comp Notice (QTY 50)",
    variantId: "47189546041475",
    price: 25,
    type: "PHYSICAL",
    previewLabel: "Notice",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Workers_Comp_Liability_Notice.png?v=1783372330",
    description: [
      "Provides workers' compensation and liability insurance notice language for contractor form packages.",
      "Useful as a companion disclosure when insurance notices must accompany the contract.",
    ],
    notice:
      "Contractors should confirm which insurance notices are required for each project and customer.",
  },
  {
    id: "professional-home-improvement-contract-electronic",
    title: "Professional Home Improvement Contract - Electronic Forms",
    pickerLabel: "Electronic Forms",
    variantId: "47072887210115",
    price: 149,
    type: "DIGITAL",
    previewLabel: "Digital",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/ChatGPTImageMay4_2026_12_13_31PM.png?v=1777922058",
    description: [
      "Electronic form package for professional home improvement contract workflows.",
      "Designed for contractors who prefer reusable digital forms instead of printed form packs.",
    ],
    notice:
      "Digital forms should still be completed and delivered according to applicable contract and disclosure requirements.",
  },
  {
    id: "contractor-contract-forms-bundle",
    title: "Contractor Contract Forms - Bundle",
    pickerLabel: "Contractor Forms Bundle",
    variantId: "47189276491907",
    price: 150,
    type: "DIGITAL",
    previewLabel: "Bundle",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/unnamed.png?v=1779382463",
    description: [
      "Bundled contractor contract forms for common residential project documentation needs.",
      "Includes forms intended to support contract, disclosure, and change-order workflows.",
    ],
    notice:
      "Bundle contents should be matched to the project type and current legal requirements before use.",
  },
  {
    id: "contract-forms-bundle",
    title: "Contract Forms Bundle",
    pickerLabel: "Contract Forms Bundle",
    variantId: "47457175076995",
    price: 150,
    type: "DIGITAL",
    previewLabel: "Bundle",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Contract_Forms.png?v=1783374465",
    description: [
      "Digital contract forms bundle for contractors who need a broader form package.",
      "Provides a convenient single purchase for multiple contract form resources.",
    ],
    notice:
      "Review each form for project fit before use and confirm applicable California disclosure requirements.",
  },
  {
    id: "entity-selection-consultation-30",
    title: "Contractor Business Entity Selection - 30 Minute Consultation",
    pickerLabel: "Entity Selection Consultation",
    variantId: "47189567668355",
    price: 100,
    type: "SERVICE",
    previewLabel: "Consult",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Entity_Consultation_-_30_minutes.png?v=1782424282",
    description: [
      "A 30-minute consultation focused on contractor business entity selection.",
      "Intended for contractors evaluating entity structure options for their business.",
    ],
    notice:
      "Consultations provide business guidance and do not replace independent legal or tax advice.",
  },
  {
    id: "bookkeeping-tax-consultation-60",
    title: "60-minute Contractor Bookkeeping & Tax Consultation",
    pickerLabel: "Bookkeeping & Tax Consultation",
    variantId: "47189573337219",
    price: 250,
    type: "SERVICE",
    previewLabel: "Tax",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0725/9006/5795/files/Consultation_-_Bookkeeping.png?v=1782427975",
    description: [
      "A 60-minute consultation for contractor bookkeeping and tax questions.",
      "Helps contractors review financial organization, bookkeeping workflows, and tax planning topics.",
    ],
    notice:
      "Consultations provide general guidance and should be coordinated with your licensed tax professional as needed.",
  },
];
