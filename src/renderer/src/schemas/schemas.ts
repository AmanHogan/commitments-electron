import { z } from "zod"

export const commitmentStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"])

export const valueEntrySchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const businessCommitmentOneSchema = z.object({
  id: z.number().optional(),
  workItem: z.string(),
  started: z.string().optional(),
  dateCompleted: z.string().optional(),
  applicationContext: z.string().optional(),
  description: z.string().optional(),
  problemOpportunity: z.string().optional(),
  whoBenefited: z.string().optional(),
  impact: z.string().optional(),
  valueCategories: z.array(z.string()).optional(),
  improvedOutcomes: z.boolean().optional(),
  improvedOutcomesText: z.string().optional(),
  increasedEfficiency: z.boolean().optional(),
  increasedEfficiencyText: z.string().optional(),
  reducedRiskCost: z.boolean().optional(),
  reducedRiskCostText: z.string().optional(),
  enhancedCustomerExperience: z.boolean().optional(),
  enhancedCustomerExperienceText: z.string().optional(),
  enhancedEmployeeExperience: z.boolean().optional(),
  enhancedEmployeeExperienceText: z.string().optional(),
  alignment: z.string().optional(),
  statusNotes: z.string().optional(),
  createdAt: z.string().optional(),
})

// Helper inferred types
export type CommitmentStatusFromSchema = z.infer<typeof commitmentStatusEnum>
export type ValueEntryFromSchema = z.infer<typeof valueEntrySchema>

// Full business commitment inferred type
export type BusinessCommitmentOneFromSchema = z.infer<typeof businessCommitmentOneSchema>

// DTOs inferred from schema
export type CreateBusinessCommitmentOneDTO = Omit<BusinessCommitmentOneFromSchema, "id" | "createdAt" | "updatedAt">
export type UpdateBusinessCommitmentOneDTO = Partial<CreateBusinessCommitmentOneDTO>

// Empty form factory (create DTO)

// Runtime helper: array of status options
export const statusOptions = commitmentStatusEnum.options

// export type BusinessCommitmentOneFromSchema = z.infer<typeof businessCommitmentOneSchema>

// export type CommitmentStatusFromSchema = z.infer<typeof commitmentStatusEnum>
// export type ValueEntryFromSchema = z.infer<typeof valueEntrySchema>

// export type CreateBusinessCommitmentOneDTO = Omit<BusinessCommitmentOneFromSchema, "id" | "createdAt" | "updatedAt">
// export type UpdateBusinessCommitmentOneDTO = Partial<CreateBusinessCommitmentOneDTO>
