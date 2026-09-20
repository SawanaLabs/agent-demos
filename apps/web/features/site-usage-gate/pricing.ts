import type { ResourceOperation } from "@/features/shared/resource-usage/server/context";

export const messageCreditCost = 1;
export const resourceCreditCosts = {
  image_generation: 5,
  text_generation: 1,
  rag_search: 1,
  sandbox_start: 4,
} satisfies Record<ResourceOperation, number>;

export const creditPriceList = [
  { label: "Message or manual workflow run", credits: messageCreditCost },
  { label: "Image generation", credits: resourceCreditCosts.image_generation },
  {
    label: "Workflow text generation",
    credits: resourceCreditCosts.text_generation,
  },
  { label: "RAG search", credits: resourceCreditCosts.rag_search },
  { label: "New Sandbox", credits: resourceCreditCosts.sandbox_start },
];
