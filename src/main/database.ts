import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const db = new Database(join(app.getPath('userData'), 'commitments.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS business_commitments_one (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workItem TEXT NOT NULL,
    started TEXT,
    dateCompleted TEXT,
    applicationContext TEXT,
    description TEXT,
    problemOpportunity TEXT,
    whoBenefited TEXT,
    impact TEXT,
    valueCategories TEXT DEFAULT '[]',
    improvedOutcomes INTEGER DEFAULT 0,
    improvedOutcomesText TEXT,
    increasedEfficiency INTEGER DEFAULT 0,
    increasedEfficiencyText TEXT,
    reducedRiskCost INTEGER DEFAULT 0,
    reducedRiskCostText TEXT,
    enhancedCustomerExperience INTEGER DEFAULT 0,
    enhancedCustomerExperienceText TEXT,
    enhancedEmployeeExperience INTEGER DEFAULT 0,
    enhancedEmployeeExperienceText TEXT,
    alignment TEXT,
    statusNotes TEXT,
    status TEXT DEFAULT 'IN_PROGRESS',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS development_commitments_one (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemName TEXT NOT NULL,
    itemDate TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS learning_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL REFERENCES development_commitments_one(id) ON DELETE CASCADE,
    moduleName TEXT NOT NULL,
    type TEXT,
    hours REAL,
    dateStarted TEXT,
    dateFinished TEXT,
    finished INTEGER DEFAULT 0,
    required INTEGER DEFAULT 0,
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS development_commitments_two (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventName TEXT NOT NULL,
    type TEXT,
    description TEXT,
    started TEXT,
    finished TEXT,
    done INTEGER DEFAULT 0,
    required INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS event_sub_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventId INTEGER NOT NULL REFERENCES development_commitments_two(id) ON DELETE CASCADE,
    subEventName TEXT NOT NULL,
    description TEXT,
    started TEXT,
    finished TEXT,
    done INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS business_commitments_two (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventName TEXT NOT NULL,
    type TEXT,
    done INTEGER DEFAULT 0,
    started TEXT,
    finished TEXT,
    required INTEGER DEFAULT 0,
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sub_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventId INTEGER NOT NULL REFERENCES business_commitments_two(id) ON DELETE CASCADE,
    subEventName TEXT NOT NULL,
    description TEXT,
    started TEXT,
    finished TEXT,
    done INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS one_on_ones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentDate TEXT NOT NULL,
    businessPartnerWork TEXT,
    workloadConcerns TEXT,
    tdpContributions TEXT,
    utilizationPercentage REAL,
    trainingSkills TEXT,
    pursuingDegrees TEXT,
    compliancePercentage REAL,
    ehsTrainingPercentage REAL,
    growthHubProgress TEXT,
    successPathwaysUpdated INTEGER DEFAULT 0,
    contingencyTrainingPercentage REAL,
    innovationEvents TEXT,
    accomplishments TEXT,
    challenges TEXT,
    goals TEXT,
    questions TEXT,
    receivingSupport TEXT,
    additionalItems TEXT,
    outOfOfficePlans TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS action_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    criticality TEXT,
    dateStarted TEXT,
    dateFinished TEXT,
    completed INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    proficiency INTEGER NOT NULL DEFAULT 3,
    date TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS flash_card_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    ownerId TEXT,
    tags TEXT DEFAULT '[]',
    timesStudied INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS flash_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setId INTEGER NOT NULL REFERENCES flash_card_sets(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    sortOrder INTEGER DEFAULT 0,
    groupName TEXT,
    termImageUrl TEXT,
    definitionImageUrl TEXT,
    hint TEXT,
    starred INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fc_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    proficiency INTEGER NOT NULL DEFAULT 3,
    date TEXT,
    flashCardSetId INTEGER REFERENCES flash_card_sets(id) ON DELETE SET NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS image_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    label TEXT,
    uploadedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resume_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    label TEXT,
    uploadedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS note_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupId INTEGER NOT NULL REFERENCES note_groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT NOT NULL DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );
`)

// Migrate existing tables — safe to run every start (errors are swallowed)
try { db.exec("ALTER TABLE skills ADD COLUMN tags TEXT DEFAULT '[]'") } catch { /* already exists */ }

const BOOL_COLS = new Set([
  'improvedOutcomes', 'increasedEfficiency', 'reducedRiskCost',
  'enhancedCustomerExperience', 'enhancedEmployeeExperience',
  'finished', 'required', 'done', 'completed', 'successPathwaysUpdated', 'starred'
])

const JSON_COLS = new Set(['valueCategories', 'tags'])

function normalize(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (BOOL_COLS.has(k)) {
      out[k] = v === 1
    } else if (JSON_COLS.has(k) && typeof v === 'string') {
      try { out[k] = JSON.parse(v) } catch { out[k] = [] }
    } else {
      out[k] = v
    }
  }
  return out
}

function normalizeAll(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(normalize)
}

// Sanitize an incoming payload so every boolean becomes 0/1 and every
// undefined becomes null before anything is passed to better-sqlite3.
// better-sqlite3's C++ binder only accepts number/string/bigint/Buffer/null —
// JS booleans are explicitly NOT on that list and throw at runtime.
function sanitize(p: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(p)) {
    if (typeof v === 'boolean') out[k] = v ? 1 : 0
    else if (v === undefined) out[k] = null
    else out[k] = v
  }
  return out
}

// Keep for compatibility — callers that pass a raw value (not via sanitize)
function boolInt(v: unknown): number {
  return v ? 1 : 0
}

// ─── Business Commitments One ─────────────────────────────────────────────────

export const bcomm1 = {
  getAll: () => normalizeAll(db.prepare('SELECT * FROM business_commitments_one ORDER BY createdAt DESC').all() as Record<string, unknown>[]),
  create: (p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const cats = JSON.stringify(Array.isArray(p.valueCategories) ? p.valueCategories : [])
    const r = db.prepare(`
      INSERT INTO business_commitments_one
        (workItem,started,dateCompleted,applicationContext,description,problemOpportunity,
         whoBenefited,impact,valueCategories,improvedOutcomes,improvedOutcomesText,
         increasedEfficiency,increasedEfficiencyText,reducedRiskCost,reducedRiskCostText,
         enhancedCustomerExperience,enhancedCustomerExperienceText,
         enhancedEmployeeExperience,enhancedEmployeeExperienceText,
         alignment,statusNotes,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(p.workItem,p.started??null,p.dateCompleted??null,p.applicationContext??null,
           p.description??null,p.problemOpportunity??null,p.whoBenefited??null,p.impact??null,
           cats,p.improvedOutcomes??0,p.improvedOutcomesText??null,
           p.increasedEfficiency??0,p.increasedEfficiencyText??null,
           p.reducedRiskCost??0,p.reducedRiskCostText??null,
           p.enhancedCustomerExperience??0,p.enhancedCustomerExperienceText??null,
           p.enhancedEmployeeExperience??0,p.enhancedEmployeeExperienceText??null,
           p.alignment??null,p.statusNotes??null,p.status??'IN_PROGRESS')
    return normalize(db.prepare('SELECT * FROM business_commitments_one WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  update: (id: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const cats = JSON.stringify(Array.isArray(p.valueCategories) ? p.valueCategories : [])
    db.prepare(`
      UPDATE business_commitments_one SET
        workItem=?,started=?,dateCompleted=?,applicationContext=?,description=?,
        problemOpportunity=?,whoBenefited=?,impact=?,valueCategories=?,
        improvedOutcomes=?,improvedOutcomesText=?,increasedEfficiency=?,increasedEfficiencyText=?,
        reducedRiskCost=?,reducedRiskCostText=?,enhancedCustomerExperience=?,
        enhancedCustomerExperienceText=?,enhancedEmployeeExperience=?,enhancedEmployeeExperienceText=?,
        alignment=?,statusNotes=?,status=?,updatedAt=datetime('now')
      WHERE id=?
    `).run(p.workItem,p.started??null,p.dateCompleted??null,p.applicationContext??null,
           p.description??null,p.problemOpportunity??null,p.whoBenefited??null,p.impact??null,
           cats,p.improvedOutcomes??0,p.improvedOutcomesText??null,
           p.increasedEfficiency??0,p.increasedEfficiencyText??null,
           p.reducedRiskCost??0,p.reducedRiskCostText??null,
           p.enhancedCustomerExperience??0,p.enhancedCustomerExperienceText??null,
           p.enhancedEmployeeExperience??0,p.enhancedEmployeeExperienceText??null,
           p.alignment??null,p.statusNotes??null,p.status??'IN_PROGRESS',id)
    return normalize(db.prepare('SELECT * FROM business_commitments_one WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM business_commitments_one WHERE id=?').run(id) }
}

// ─── Development Commitments One ─────────────────────────────────────────────

export const dcomm1 = {
  getAll: () => normalizeAll(db.prepare('SELECT * FROM development_commitments_one ORDER BY createdAt DESC').all() as Record<string, unknown>[]),
  create: (p: Record<string, unknown>) => {
    const r = db.prepare('INSERT INTO development_commitments_one (itemName,itemDate) VALUES (?,?)').run(p.itemName, p.itemDate??null)
    return normalize(db.prepare('SELECT * FROM development_commitments_one WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  update: (id: number, p: Record<string, unknown>) => {
    db.prepare("UPDATE development_commitments_one SET itemName=?,itemDate=?,updatedAt=datetime('now') WHERE id=?").run(p.itemName, p.itemDate??null, id)
    return normalize(db.prepare('SELECT * FROM development_commitments_one WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM development_commitments_one WHERE id=?').run(id) },
  getModules: (itemId: number) => normalizeAll(db.prepare('SELECT * FROM learning_modules WHERE itemId=? ORDER BY createdAt ASC').all(itemId) as Record<string, unknown>[]),
  createModule: (itemId: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const r = db.prepare(`
      INSERT INTO learning_modules (itemId,moduleName,type,hours,dateStarted,dateFinished,finished,required,description)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(itemId,p.moduleName,p.type??null,p.hours??null,p.dateStarted??null,p.dateFinished??null,p.finished??0,p.required??0,p.description??null)
    return normalize(db.prepare('SELECT * FROM learning_modules WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  updateModule: (moduleId: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    db.prepare(`UPDATE learning_modules SET moduleName=?,type=?,hours=?,dateStarted=?,dateFinished=?,finished=?,required=?,description=?,updatedAt=datetime('now') WHERE id=?`)
      .run(p.moduleName,p.type??null,p.hours??null,p.dateStarted??null,p.dateFinished??null,p.finished??0,p.required??0,p.description??null,moduleId)
    return normalize(db.prepare('SELECT * FROM learning_modules WHERE id=?').get(moduleId) as Record<string, unknown>)
  },
  deleteModule: (moduleId: number) => { db.prepare('DELETE FROM learning_modules WHERE id=?').run(moduleId) }
}

// ─── Development Commitments Two ─────────────────────────────────────────────

export const dcomm2 = {
  getAll: () => normalizeAll(db.prepare('SELECT * FROM development_commitments_two ORDER BY createdAt DESC').all() as Record<string, unknown>[]),
  create: (p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const r = db.prepare('INSERT INTO development_commitments_two (eventName,type,description,started,finished,done,required) VALUES (?,?,?,?,?,?,?)').run(p.eventName,p.type??null,p.description??null,p.started??null,p.finished??null,p.done??0,p.required??0)
    return normalize(db.prepare('SELECT * FROM development_commitments_two WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  update: (id: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    db.prepare("UPDATE development_commitments_two SET eventName=?,type=?,description=?,started=?,finished=?,done=?,required=?,updatedAt=datetime('now') WHERE id=?").run(p.eventName,p.type??null,p.description??null,p.started??null,p.finished??null,p.done??0,p.required??0,id)
    return normalize(db.prepare('SELECT * FROM development_commitments_two WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM development_commitments_two WHERE id=?').run(id) },
  getSubEvents: (eventId: number) => normalizeAll(db.prepare('SELECT * FROM event_sub_items WHERE eventId=? ORDER BY createdAt ASC').all(eventId) as Record<string, unknown>[]),
  createSubEvent: (eventId: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const r = db.prepare('INSERT INTO event_sub_items (eventId,subEventName,description,started,finished,done) VALUES (?,?,?,?,?,?)').run(eventId,p.subEventName,p.description??null,p.started??null,p.finished??null,p.done??0)
    return normalize(db.prepare('SELECT * FROM event_sub_items WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  updateSubEvent: (subItemId: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    db.prepare("UPDATE event_sub_items SET subEventName=?,description=?,started=?,finished=?,done=?,updatedAt=datetime('now') WHERE id=?").run(p.subEventName,p.description??null,p.started??null,p.finished??null,p.done??0,subItemId)
    return normalize(db.prepare('SELECT * FROM event_sub_items WHERE id=?').get(subItemId) as Record<string, unknown>)
  },
  deleteSubEvent: (subItemId: number) => { db.prepare('DELETE FROM event_sub_items WHERE id=?').run(subItemId) }
}

// ─── Business Commitments Two ─────────────────────────────────────────────────

export const bcomm2 = {
  getAll: () => {
    const events = normalizeAll(db.prepare('SELECT * FROM business_commitments_two ORDER BY createdAt DESC').all() as Record<string, unknown>[])
    return events.map(ev => ({
      ...ev,
      subEvents: normalizeAll(db.prepare('SELECT * FROM sub_events WHERE eventId=? ORDER BY createdAt ASC').all(ev.id as number) as Record<string, unknown>[])
    }))
  },
  create: (p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const r = db.prepare('INSERT INTO business_commitments_two (eventName,type,done,started,finished,required,description) VALUES (?,?,?,?,?,?,?)').run(p.eventName,p.type??null,p.done??0,p.started??null,p.finished??null,p.required??0,p.description??null)
    const ev = normalize(db.prepare('SELECT * FROM business_commitments_two WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
    return { ...ev, subEvents: [] }
  },
  update: (id: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    db.prepare("UPDATE business_commitments_two SET eventName=?,type=?,done=?,started=?,finished=?,required=?,description=?,updatedAt=datetime('now') WHERE id=?").run(p.eventName,p.type??null,p.done??0,p.started??null,p.finished??null,p.required??0,p.description??null,id)
    return normalize(db.prepare('SELECT * FROM business_commitments_two WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM business_commitments_two WHERE id=?').run(id) },
  getSubEvents: (eventId: number) => normalizeAll(db.prepare('SELECT * FROM sub_events WHERE eventId=? ORDER BY createdAt ASC').all(eventId) as Record<string, unknown>[]),
  createSubEvent: (eventId: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const r = db.prepare('INSERT INTO sub_events (eventId,subEventName,description,started,finished,done) VALUES (?,?,?,?,?,?)').run(eventId,p.subEventName,p.description??null,p.started??null,p.finished??null,p.done??0)
    return normalize(db.prepare('SELECT * FROM sub_events WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  updateSubEvent: (subEventId: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    db.prepare("UPDATE sub_events SET subEventName=?,description=?,started=?,finished=?,done=?,updatedAt=datetime('now') WHERE id=?").run(p.subEventName,p.description??null,p.started??null,p.finished??null,p.done??0,subEventId)
    return normalize(db.prepare('SELECT * FROM sub_events WHERE id=?').get(subEventId) as Record<string, unknown>)
  },
  deleteSubEvent: (subEventId: number) => { db.prepare('DELETE FROM sub_events WHERE id=?').run(subEventId) }
}

// ─── One on One ───────────────────────────────────────────────────────────────

export const oneOnOne = {
  getAll: () => normalizeAll(db.prepare('SELECT * FROM one_on_ones ORDER BY documentDate DESC').all() as Record<string, unknown>[]),
  create: (p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const r = db.prepare(`
      INSERT INTO one_on_ones (documentDate,businessPartnerWork,workloadConcerns,tdpContributions,
        utilizationPercentage,trainingSkills,pursuingDegrees,compliancePercentage,ehsTrainingPercentage,
        growthHubProgress,successPathwaysUpdated,contingencyTrainingPercentage,innovationEvents,
        accomplishments,challenges,goals,questions,receivingSupport,additionalItems,outOfOfficePlans)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(p.documentDate,p.businessPartnerWork??null,p.workloadConcerns??null,p.tdpContributions??null,
           p.utilizationPercentage??null,p.trainingSkills??null,p.pursuingDegrees??null,
           p.compliancePercentage??null,p.ehsTrainingPercentage??null,p.growthHubProgress??null,
           p.successPathwaysUpdated??0,p.contingencyTrainingPercentage??null,p.innovationEvents??null,
           p.accomplishments??null,p.challenges??null,p.goals??null,p.questions??null,
           p.receivingSupport??null,p.additionalItems??null,p.outOfOfficePlans??null)
    return normalize(db.prepare('SELECT * FROM one_on_ones WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  update: (id: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    db.prepare(`
      UPDATE one_on_ones SET documentDate=?,businessPartnerWork=?,workloadConcerns=?,tdpContributions=?,
        utilizationPercentage=?,trainingSkills=?,pursuingDegrees=?,compliancePercentage=?,ehsTrainingPercentage=?,
        growthHubProgress=?,successPathwaysUpdated=?,contingencyTrainingPercentage=?,innovationEvents=?,
        accomplishments=?,challenges=?,goals=?,questions=?,receivingSupport=?,additionalItems=?,outOfOfficePlans=?,
        updatedAt=datetime('now')
      WHERE id=?
    `).run(p.documentDate,p.businessPartnerWork??null,p.workloadConcerns??null,p.tdpContributions??null,
           p.utilizationPercentage??null,p.trainingSkills??null,p.pursuingDegrees??null,
           p.compliancePercentage??null,p.ehsTrainingPercentage??null,p.growthHubProgress??null,
           p.successPathwaysUpdated??0,p.contingencyTrainingPercentage??null,p.innovationEvents??null,
           p.accomplishments??null,p.challenges??null,p.goals??null,p.questions??null,
           p.receivingSupport??null,p.additionalItems??null,p.outOfOfficePlans??null,id)
    return normalize(db.prepare('SELECT * FROM one_on_ones WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM one_on_ones WHERE id=?').run(id) }
}

// ─── Action Items ─────────────────────────────────────────────────────────────

export const actionItems = {
  getAll: () => normalizeAll(db.prepare('SELECT * FROM action_items ORDER BY createdAt DESC').all() as Record<string, unknown>[]),
  create: (p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    const r = db.prepare('INSERT INTO action_items (name,description,criticality,dateStarted,dateFinished,completed) VALUES (?,?,?,?,?,?)').run(p.name,p.description??null,p.criticality??null,p.dateStarted??null,p.dateFinished??null,p.completed??0)
    return normalize(db.prepare('SELECT * FROM action_items WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  update: (id: number, p_raw: Record<string, unknown>) => {
    const p = sanitize(p_raw)
    db.prepare("UPDATE action_items SET name=?,description=?,criticality=?,dateStarted=?,dateFinished=?,completed=?,updatedAt=datetime('now') WHERE id=?").run(p.name,p.description??null,p.criticality??null,p.dateStarted??null,p.dateFinished??null,p.completed??0,id)
    return normalize(db.prepare('SELECT * FROM action_items WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM action_items WHERE id=?').run(id) }
}

// ─── Flash Card Sets ──────────────────────────────────────────────────────────

export const fcSets = {
  getAll: () => {
    const rows = db.prepare(`
      SELECT s.*, (SELECT COUNT(*) FROM flash_cards WHERE setId = s.id) as cardCount
      FROM flash_card_sets s ORDER BY s.createdAt DESC
    `).all() as Record<string, unknown>[]
    return rows.map(r => ({ ...normalize(r), flashCards: [] }))
  },
  get: (id: number) => {
    const set = normalize(db.prepare('SELECT * FROM flash_card_sets WHERE id=?').get(id) as Record<string, unknown>)
    const flashCards = normalizeAll(db.prepare('SELECT * FROM flash_cards WHERE setId=? ORDER BY sortOrder ASC').all(id) as Record<string, unknown>[])
    return { ...set, flashCards }
  },
  create: (p: Record<string, unknown>) => {
    const r = db.prepare('INSERT INTO flash_card_sets (title,description,topic,ownerId,tags) VALUES (?,?,?,?,?)').run(p.title, p.description??null, p.topic??null, p.ownerId??null, JSON.stringify(p.tags ?? []))
    return normalize(db.prepare('SELECT * FROM flash_card_sets WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  update: (id: number, p: Record<string, unknown>) => {
    db.prepare("UPDATE flash_card_sets SET title=?,description=?,topic=?,tags=?,updatedAt=datetime('now') WHERE id=?").run(p.title, p.description??null, p.topic??null, JSON.stringify(p.tags ?? []), id)
    return normalize(db.prepare('SELECT * FROM flash_card_sets WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM flash_card_sets WHERE id=?').run(id) },
  study: (id: number) => {
    db.prepare("UPDATE flash_card_sets SET timesStudied=timesStudied+1,updatedAt=datetime('now') WHERE id=?").run(id)
    return normalize(db.prepare('SELECT * FROM flash_card_sets WHERE id=?').get(id) as Record<string, unknown>)
  }
}

// ─── Flash Cards ──────────────────────────────────────────────────────────────

export const fcCards = {
  list: (setId: number) => normalizeAll(db.prepare('SELECT * FROM flash_cards WHERE setId=? ORDER BY sortOrder ASC').all(setId) as Record<string, unknown>[]),
  create: (setId: number, p: Record<string, unknown>) => {
    const r = db.prepare('INSERT INTO flash_cards (setId,term,definition,sortOrder,groupName,termImageUrl,definitionImageUrl,hint,starred) VALUES (?,?,?,?,?,?,?,?,?)').run(setId, p.term, p.definition, p.sortOrder??0, p.groupName??null, p.termImageUrl??null, p.definitionImageUrl??null, p.hint??null, boolInt(p.starred))
    return normalize(db.prepare('SELECT * FROM flash_cards WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  createBulk: (setId: number, cards: Record<string, unknown>[]) => {
    const stmt = db.prepare('INSERT INTO flash_cards (setId,term,definition,sortOrder,groupName,hint,starred) VALUES (?,?,?,?,?,?,?)')
    const insertMany = db.transaction((cs: Record<string, unknown>[]) => cs.map(c => {
      const r = stmt.run(setId, c.term, c.definition, c.sortOrder??0, c.groupName??null, c.hint??null, 0)
      return normalize(db.prepare('SELECT * FROM flash_cards WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
    }))
    return insertMany(cards)
  },
  update: (setId: number, cardId: number, p: Record<string, unknown>) => {
    const fields: string[] = []
    const vals: unknown[] = []
    if (p.term !== undefined) { fields.push('term=?'); vals.push(p.term) }
    if (p.definition !== undefined) { fields.push('definition=?'); vals.push(p.definition) }
    if (p.sortOrder !== undefined) { fields.push('sortOrder=?'); vals.push(p.sortOrder) }
    if ('groupName' in p) { fields.push('groupName=?'); vals.push(p.groupName??null) }
    if ('hint' in p) { fields.push('hint=?'); vals.push(p.hint??null) }
    if (p.starred !== undefined) { fields.push('starred=?'); vals.push(boolInt(p.starred)) }
    if (fields.length) {
      db.prepare(`UPDATE flash_cards SET ${fields.join(',')},updatedAt=datetime('now') WHERE id=? AND setId=?`).run(...vals, cardId, setId)
    }
    return normalize(db.prepare('SELECT * FROM flash_cards WHERE id=?').get(cardId) as Record<string, unknown>)
  },
  toggleStar: (setId: number, cardId: number) => {
    db.prepare("UPDATE flash_cards SET starred=CASE WHEN starred=1 THEN 0 ELSE 1 END,updatedAt=datetime('now') WHERE id=? AND setId=?").run(cardId, setId)
    return normalize(db.prepare('SELECT * FROM flash_cards WHERE id=?').get(cardId) as Record<string, unknown>)
  },
  delete: (setId: number, cardId: number) => { db.prepare('DELETE FROM flash_cards WHERE id=? AND setId=?').run(cardId, setId) },
  getStarredGrouped: () => {
    const sets = db.prepare('SELECT id, title FROM flash_card_sets ORDER BY title ASC').all() as { id: number; title: string }[]
    return sets.map(s => ({
      set: { id: s.id, title: s.title },
      cards: normalizeAll(db.prepare('SELECT * FROM flash_cards WHERE setId=? AND starred=1 ORDER BY sortOrder ASC').all(s.id) as Record<string, unknown>[])
    })).filter(g => g.cards.length > 0)
  },
  groups: (setId: number) => {
    return (db.prepare("SELECT DISTINCT groupName FROM flash_cards WHERE setId=? AND groupName IS NOT NULL ORDER BY groupName ASC").all(setId) as { groupName: string }[]).map(r => r.groupName)
  }
}

// ─── FC Skills ────────────────────────────────────────────────────────────────

export const fcSkills = {
  list: () => {
    const rows = db.prepare(`
      SELECT fs.*, fcs.title as flashCardSetTitle
      FROM fc_skills fs LEFT JOIN flash_card_sets fcs ON fs.flashCardSetId = fcs.id
      ORDER BY fs.proficiency DESC
    `).all() as Record<string, unknown>[]
    return normalizeAll(rows)
  },
  listBySet: (setId: number) => normalizeAll(db.prepare('SELECT * FROM fc_skills WHERE flashCardSetId=? ORDER BY proficiency DESC').all(setId) as Record<string, unknown>[]),
  create: (p: Record<string, unknown>) => {
    const r = db.prepare('INSERT INTO fc_skills (name,proficiency,date,flashCardSetId) VALUES (?,?,?,?)').run(p.name, p.proficiency??3, p.date??null, p.flashCardSetId??null)
    const row = db.prepare('SELECT fs.*, fcs.title as flashCardSetTitle FROM fc_skills fs LEFT JOIN flash_card_sets fcs ON fs.flashCardSetId=fcs.id WHERE fs.id=?').get(r.lastInsertRowid) as Record<string, unknown>
    return normalize(row)
  },
  update: (id: number, p: Record<string, unknown>) => {
    db.prepare("UPDATE fc_skills SET name=?,proficiency=?,date=?,flashCardSetId=?,updatedAt=datetime('now') WHERE id=?").run(p.name, p.proficiency??3, p.date??null, p.flashCardSetId??null, id)
    const row = db.prepare('SELECT fs.*, fcs.title as flashCardSetTitle FROM fc_skills fs LEFT JOIN flash_card_sets fcs ON fs.flashCardSetId=fcs.id WHERE fs.id=?').get(id) as Record<string, unknown>
    return normalize(row)
  },
  delete: (id: number) => { db.prepare('DELETE FROM fc_skills WHERE id=?').run(id) }
}

// ─── Image Files ──────────────────────────────────────────────────────────────

export const imageFiles = {
  getAll: () => db.prepare('SELECT * FROM image_files ORDER BY uploadedAt DESC').all(),
  create: (filename: string, label?: string) => {
    const r = db.prepare('INSERT INTO image_files (filename, label) VALUES (?, ?)').run(filename, label ?? null)
    return db.prepare('SELECT * FROM image_files WHERE id=?').get(r.lastInsertRowid)
  },
  updateLabel: (id: number, label: string) => {
    db.prepare('UPDATE image_files SET label=? WHERE id=?').run(label, id)
    return db.prepare('SELECT * FROM image_files WHERE id=?').get(id)
  },
  delete: (id: number) => { db.prepare('DELETE FROM image_files WHERE id=?').run(id) }
}

// ─── Resume Files ─────────────────────────────────────────────────────────────

export const resumeFiles = {
  getAll: () => db.prepare('SELECT * FROM resume_files ORDER BY uploadedAt DESC').all(),
  create: (filename: string, label?: string) => {
    const r = db.prepare('INSERT INTO resume_files (filename, label) VALUES (?, ?)').run(filename, label ?? null)
    return db.prepare('SELECT * FROM resume_files WHERE id=?').get(r.lastInsertRowid)
  },
  updateLabel: (id: number, label: string) => {
    db.prepare('UPDATE resume_files SET label=? WHERE id=?').run(label, id)
    return db.prepare('SELECT * FROM resume_files WHERE id=?').get(id)
  },
  delete: (id: number) => { db.prepare('DELETE FROM resume_files WHERE id=?').run(id) }
}

// ─── Note Groups ─────────────────────────────────────────────────────────────

export const noteGroups = {
  getAll: () => {
    return db.prepare(`
      SELECT g.*, (SELECT COUNT(*) FROM notes WHERE groupId = g.id) as noteCount
      FROM note_groups g ORDER BY g.updatedAt DESC
    `).all()
  },
  create: (name: string) => {
    const r = db.prepare('INSERT INTO note_groups (name) VALUES (?)').run(name)
    return db.prepare('SELECT * FROM note_groups WHERE id=?').get(r.lastInsertRowid)
  },
  update: (id: number, name: string) => {
    db.prepare("UPDATE note_groups SET name=?,updatedAt=datetime('now') WHERE id=?").run(name, id)
    return db.prepare('SELECT * FROM note_groups WHERE id=?').get(id)
  },
  delete: (id: number) => { db.prepare('DELETE FROM note_groups WHERE id=?').run(id) }
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export const notes = {
  listByGroup: (groupId: number) => db.prepare('SELECT * FROM notes WHERE groupId=? ORDER BY updatedAt DESC').all(groupId),
  create: (groupId: number, title: string) => {
    const r = db.prepare('INSERT INTO notes (groupId, title, content) VALUES (?, ?, ?)').run(groupId, title, '')
    return db.prepare('SELECT * FROM notes WHERE id=?').get(r.lastInsertRowid)
  },
  update: (id: number, p: Record<string, unknown>) => {
    const fields: string[] = []
    const vals: unknown[] = []
    if (p.title !== undefined) { fields.push('title=?'); vals.push(p.title) }
    if (p.content !== undefined) { fields.push('content=?'); vals.push(p.content) }
    if (fields.length) {
      db.prepare(`UPDATE notes SET ${fields.join(',')},updatedAt=datetime('now') WHERE id=?`).run(...vals, id)
    }
    return db.prepare('SELECT * FROM notes WHERE id=?').get(id)
  },
  delete: (id: number) => { db.prepare('DELETE FROM notes WHERE id=?').run(id) }
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export const skills = {
  getAll: () => normalizeAll(db.prepare('SELECT * FROM skills ORDER BY proficiency DESC').all() as Record<string, unknown>[]),
  create: (p: Record<string, unknown>) => {
    const r = db.prepare('INSERT INTO skills (name,proficiency,date,tags) VALUES (?,?,?,?)').run(p.name, p.proficiency??3, p.date??null, JSON.stringify(p.tags ?? []))
    return normalize(db.prepare('SELECT * FROM skills WHERE id=?').get(r.lastInsertRowid) as Record<string, unknown>)
  },
  update: (id: number, p: Record<string, unknown>) => {
    db.prepare("UPDATE skills SET name=?,proficiency=?,date=?,tags=?,updatedAt=datetime('now') WHERE id=?").run(p.name, p.proficiency??3, p.date??null, JSON.stringify(p.tags ?? []), id)
    return normalize(db.prepare('SELECT * FROM skills WHERE id=?').get(id) as Record<string, unknown>)
  },
  delete: (id: number) => { db.prepare('DELETE FROM skills WHERE id=?').run(id) }
}
