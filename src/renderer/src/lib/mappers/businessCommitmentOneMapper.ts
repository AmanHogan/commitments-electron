import type {
  BusinessCommitmentOne,
  BusinessCommitmentOneFormState,
  CreateBusinessCommitmentOneDTO,
  ValueEntry,
} from "@/types/types"

/**
 * Converts a backend API response into form state.
 * Derives valueEntryList from the backend's individual boolean+text pairs.
 */
export function toFormState(commitment: BusinessCommitmentOne): BusinessCommitmentOneFormState {
  const valueEntryList: ValueEntry[] = []
  if (commitment.improvedOutcomes)
    valueEntryList.push({ label: "Improved outcomes", value: commitment.improvedOutcomesText ?? "" })
  if (commitment.increasedEfficiency)
    valueEntryList.push({ label: "Increased efficiency", value: commitment.increasedEfficiencyText ?? "" })
  if (commitment.reducedRiskCost)
    valueEntryList.push({ label: "Reduced risk/cost", value: commitment.reducedRiskCostText ?? "" })
  if (commitment.enhancedCustomerExperience)
    valueEntryList.push({
      label: "Enhanced customer experience",
      value: commitment.enhancedCustomerExperienceText ?? "",
    })
  if (commitment.enhancedEmployeeExperience)
    valueEntryList.push({
      label: "Enhanced employee experience",
      value: commitment.enhancedEmployeeExperienceText ?? "",
    })

  return {
    workItem: commitment.workItem ?? "",
    started: commitment.started ?? "",
    dateCompleted: commitment.dateCompleted ?? "",
    applicationContext: commitment.applicationContext ?? "",
    description: commitment.description ?? "",
    problemOpportunity: commitment.problemOpportunity ?? "",
    whoBenefited: commitment.whoBenefited ?? "",
    impact: commitment.impact ?? "",
    valueCategories: commitment.valueCategories ?? [],
    improvedOutcomes: commitment.improvedOutcomes ?? false,
    improvedOutcomesText: commitment.improvedOutcomesText ?? "",
    increasedEfficiency: commitment.increasedEfficiency ?? false,
    increasedEfficiencyText: commitment.increasedEfficiencyText ?? "",
    reducedRiskCost: commitment.reducedRiskCost ?? false,
    reducedRiskCostText: commitment.reducedRiskCostText ?? "",
    enhancedCustomerExperience: commitment.enhancedCustomerExperience ?? false,
    enhancedCustomerExperienceText: commitment.enhancedCustomerExperienceText ?? "",
    enhancedEmployeeExperience: commitment.enhancedEmployeeExperience ?? false,
    enhancedEmployeeExperienceText: commitment.enhancedEmployeeExperienceText ?? "",
    alignment: commitment.alignment ?? "",
    statusNotes: commitment.statusNotes ?? "",
    valueEntryList,
    status: "IN_PROGRESS",
  }
}

/**
 * Converts form state into the API payload shape.
 * Maps valueEntryList entries back to the backend's individual boolean+text pairs.
 */
export function toApiPayload(form: BusinessCommitmentOneFormState): CreateBusinessCommitmentOneDTO {
  const { valueEntryList, status, ...rest } = form

  const valueFields: Partial<CreateBusinessCommitmentOneDTO> = {
    improvedOutcomes: false,
    improvedOutcomesText: "",
    increasedEfficiency: false,
    increasedEfficiencyText: "",
    reducedRiskCost: false,
    reducedRiskCostText: "",
    enhancedCustomerExperience: false,
    enhancedCustomerExperienceText: "",
    enhancedEmployeeExperience: false,
    enhancedEmployeeExperienceText: "",
  }

  for (const entry of valueEntryList ?? []) {
    switch (entry.label) {
      case "Improved outcomes":
        valueFields.improvedOutcomes = true
        valueFields.improvedOutcomesText = entry.value
        break
      case "Increased efficiency":
        valueFields.increasedEfficiency = true
        valueFields.increasedEfficiencyText = entry.value
        break
      case "Reduced risk/cost":
        valueFields.reducedRiskCost = true
        valueFields.reducedRiskCostText = entry.value
        break
      case "Enhanced customer experience":
        valueFields.enhancedCustomerExperience = true
        valueFields.enhancedCustomerExperienceText = entry.value
        break
      case "Enhanced employee experience":
        valueFields.enhancedEmployeeExperience = true
        valueFields.enhancedEmployeeExperienceText = entry.value
        break
    }
  }

  return { ...rest, ...valueFields }
}

// Keep old name as alias so any other callers still compile
export const toCreateBusinessCommitmentOneDTO = toFormState
