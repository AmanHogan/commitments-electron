import type {
  BusinessCommitmentOne,
  CreateBusinessCommitmentOneDTO,
  UpdateBusinessCommitmentOneDTO,
  DevelopmentCommitmentOne,
  CreateDevelopmentCommitmentOneDTO,
  UpdateDevelopmentCommitmentOneDTO,
  LearningModule,
  CreateLearningModuleDTO,
  UpdateLearningModuleDTO,
  DevelopmentCommitmentTwo,
  CreateDevelopmentCommitmentTwoDTO,
  EventSubItem,
  CreateEventSubItemDTO,
  UpdateEventSubItemDTO,
  BusinessCommitmentTwo,
  CreateBusinessCommitmentTwoDTO,
  UpdateBusinessCommitmentTwoDTO,
  SubEvent,
  CreateSubEventDTO,
  UpdateSubEventDTO,
  OneOnOne,
  CreateOneOnOneDTO,
  UpdateOneOnOneDTO,
  ActionItem,
  CreateActionItemDTO,
  UpdateActionItemDTO,
  Skill,
  CreateSkillDTO,
} from '@/types/types'

const { api } = window

// ─── Business Commitments One ─────────────────────────────────────────────────

export const getAllCommitmentsOne = (): Promise<BusinessCommitmentOne[]> =>
  api.bcomm1.getAll() as Promise<BusinessCommitmentOne[]>

export const createCommitmentOne = (payload: CreateBusinessCommitmentOneDTO): Promise<BusinessCommitmentOne> =>
  api.bcomm1.create(payload) as Promise<BusinessCommitmentOne>

export const updateBusinessCommitmentOne = (id: number, payload: UpdateBusinessCommitmentOneDTO): Promise<BusinessCommitmentOne> =>
  api.bcomm1.update(id, payload) as Promise<BusinessCommitmentOne>

export const deleteCommitmentOne = (id: number): Promise<void> =>
  api.bcomm1.delete(id)

// ─── Development Commitments One ─────────────────────────────────────────────

export const getAllDevelopmentCommitmentsOne = (): Promise<DevelopmentCommitmentOne[]> =>
  api.dcomm1.getAll() as Promise<DevelopmentCommitmentOne[]>

export const createDevelopmentCommitmentOne = (payload: CreateDevelopmentCommitmentOneDTO): Promise<DevelopmentCommitmentOne> =>
  api.dcomm1.create(payload) as Promise<DevelopmentCommitmentOne>

export const updateDevelopmentCommitmentOne = (id: number, payload: UpdateDevelopmentCommitmentOneDTO): Promise<DevelopmentCommitmentOne> =>
  api.dcomm1.update(id, payload) as Promise<DevelopmentCommitmentOne>

export const deleteDevelopmentCommitmentOne = (id: number): Promise<void> =>
  api.dcomm1.delete(id)

export const getModulesForItem = (itemId: number): Promise<LearningModule[]> =>
  api.dcomm1.getModules(itemId) as Promise<LearningModule[]>

export const createModuleForItem = (itemId: number, payload: CreateLearningModuleDTO): Promise<LearningModule> =>
  api.dcomm1.createModule(itemId, payload) as Promise<LearningModule>

export const updateLearningModule = (moduleId: number, payload: UpdateLearningModuleDTO): Promise<LearningModule> =>
  api.dcomm1.updateModule(moduleId, payload) as Promise<LearningModule>

export const deleteLearningModule = (moduleId: number): Promise<void> =>
  api.dcomm1.deleteModule(moduleId)

// ─── Development Commitments Two ─────────────────────────────────────────────

export const getAllDevelopmentCommitmentsTwo = (): Promise<DevelopmentCommitmentTwo[]> =>
  api.dcomm2.getAll() as Promise<DevelopmentCommitmentTwo[]>

export const createDevelopmentCommitmentTwo = (payload: CreateDevelopmentCommitmentTwoDTO): Promise<DevelopmentCommitmentTwo> =>
  api.dcomm2.create(payload) as Promise<DevelopmentCommitmentTwo>

export const updateDevelopmentCommitmentTwo = (id: number, payload: CreateDevelopmentCommitmentTwoDTO): Promise<DevelopmentCommitmentTwo> =>
  api.dcomm2.update(id, payload) as Promise<DevelopmentCommitmentTwo>

export const deleteDevelopmentCommitmentTwo = (id: number): Promise<void> =>
  api.dcomm2.delete(id)

export const getDcomm2SubEvents = (eventId: number): Promise<EventSubItem[]> =>
  api.dcomm2.getSubEvents(eventId) as Promise<EventSubItem[]>

export const createDcomm2SubEvent = (eventId: number, payload: CreateEventSubItemDTO): Promise<EventSubItem> =>
  api.dcomm2.createSubEvent(eventId, payload) as Promise<EventSubItem>

export const updateDcomm2SubEvent = (subItemId: number, payload: UpdateEventSubItemDTO): Promise<EventSubItem> =>
  api.dcomm2.updateSubEvent(subItemId, payload) as Promise<EventSubItem>

export const deleteDcomm2SubEvent = (subItemId: number): Promise<void> =>
  api.dcomm2.deleteSubEvent(subItemId)

// ─── Business Commitments Two ─────────────────────────────────────────────────

export const getAllBusinessCommitmentsTwo = (): Promise<BusinessCommitmentTwo[]> =>
  api.bcomm2.getAll() as Promise<BusinessCommitmentTwo[]>

export const createBusinessCommitmentTwo = (payload: CreateBusinessCommitmentTwoDTO): Promise<BusinessCommitmentTwo> =>
  api.bcomm2.create(payload) as Promise<BusinessCommitmentTwo>

export const updateBusinessCommitmentTwo = (id: number, payload: UpdateBusinessCommitmentTwoDTO): Promise<BusinessCommitmentTwo> =>
  api.bcomm2.update(id, payload) as Promise<BusinessCommitmentTwo>

export const deleteBusinessCommitmentTwo = (id: number): Promise<void> =>
  api.bcomm2.delete(id)

export const getSubEventsForBcomm2 = (eventId: number): Promise<SubEvent[]> =>
  api.bcomm2.getSubEvents(eventId) as Promise<SubEvent[]>

export const createSubEventForBcomm2 = (eventId: number, payload: CreateSubEventDTO): Promise<SubEvent> =>
  api.bcomm2.createSubEvent(eventId, payload) as Promise<SubEvent>

export const updateBcomm2SubEvent = (subEventId: number, payload: UpdateSubEventDTO): Promise<SubEvent> =>
  api.bcomm2.updateSubEvent(subEventId, payload) as Promise<SubEvent>

export const deleteBcomm2SubEvent = (subEventId: number): Promise<void> =>
  api.bcomm2.deleteSubEvent(subEventId)

// ─── One on One ───────────────────────────────────────────────────────────────

export const getAllOneOnOnes = (): Promise<OneOnOne[]> =>
  api.oneOnOne.getAll() as Promise<OneOnOne[]>

export const createOneOnOne = (payload: CreateOneOnOneDTO): Promise<OneOnOne> =>
  api.oneOnOne.create(payload) as Promise<OneOnOne>

export const updateOneOnOne = (id: number, payload: UpdateOneOnOneDTO): Promise<OneOnOne> =>
  api.oneOnOne.update(id, payload) as Promise<OneOnOne>

export const deleteOneOnOne = (id: number): Promise<void> =>
  api.oneOnOne.delete(id)

// ─── Action Items ─────────────────────────────────────────────────────────────

export const getAllActionItems = (): Promise<ActionItem[]> =>
  api.actionItems.getAll() as Promise<ActionItem[]>

export const createActionItem = (payload: CreateActionItemDTO): Promise<ActionItem> =>
  api.actionItems.create(payload) as Promise<ActionItem>

export const updateActionItem = (id: number, payload: UpdateActionItemDTO): Promise<ActionItem> =>
  api.actionItems.update(id, payload) as Promise<ActionItem>

export const deleteActionItem = (id: number): Promise<void> =>
  api.actionItems.delete(id)

// ─── Skills ───────────────────────────────────────────────────────────────────

export const getAllSkills = (): Promise<Skill[]> =>
  api.skills.getAll() as Promise<Skill[]>

export const createSkill = (payload: CreateSkillDTO): Promise<Skill> =>
  api.skills.create(payload) as Promise<Skill>

export const updateSkill = (id: number, payload: CreateSkillDTO): Promise<Skill> =>
  api.skills.update(id, payload) as Promise<Skill>

export const deleteSkill = (id: number): Promise<void> =>
  api.skills.delete(id)
