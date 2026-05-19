import { ElectronAPI } from '@electron-toolkit/preload'

interface DbApi {
  bcomm1: {
    getAll: () => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  dcomm1: {
    getAll: () => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
    getModules: (itemId: number) => Promise<unknown[]>
    createModule: (itemId: number, payload: unknown) => Promise<unknown>
    updateModule: (moduleId: number, payload: unknown) => Promise<unknown>
    deleteModule: (moduleId: number) => Promise<void>
  }
  dcomm2: {
    getAll: () => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
    getSubEvents: (eventId: number) => Promise<unknown[]>
    createSubEvent: (eventId: number, payload: unknown) => Promise<unknown>
    updateSubEvent: (subItemId: number, payload: unknown) => Promise<unknown>
    deleteSubEvent: (subItemId: number) => Promise<void>
  }
  bcomm2: {
    getAll: () => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
    getSubEvents: (eventId: number) => Promise<unknown[]>
    createSubEvent: (eventId: number, payload: unknown) => Promise<unknown>
    updateSubEvent: (subEventId: number, payload: unknown) => Promise<unknown>
    deleteSubEvent: (subEventId: number) => Promise<void>
  }
  oneOnOne: {
    getAll: () => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  actionItems: {
    getAll: () => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  skills: {
    getAll: () => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  fcSets: {
    getAll: () => Promise<unknown[]>
    get: (id: number) => Promise<unknown>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
    study: (id: number) => Promise<unknown>
  }
  fcCards: {
    list: (setId: number) => Promise<unknown[]>
    create: (setId: number, payload: unknown) => Promise<unknown>
    createBulk: (setId: number, payload: unknown) => Promise<unknown[]>
    update: (setId: number, cardId: number, payload: unknown) => Promise<unknown>
    toggleStar: (setId: number, cardId: number) => Promise<unknown>
    delete: (setId: number, cardId: number) => Promise<void>
    getStarredGrouped: () => Promise<unknown[]>
    groups: (setId: number) => Promise<string[]>
  }
  fcSkills: {
    list: () => Promise<unknown[]>
    listBySet: (setId: number) => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  files: {
    save: (sourcePath: string) => Promise<string>
    delete: (filename: string) => Promise<void>
    openDialog: (filters: { name: string; extensions: string[] }[]) => Promise<string[]>
    getFileUrl: (filename: string) => Promise<string>
  }
  imageFiles: {
    getAll: () => Promise<unknown[]>
    create: (filename: string, label?: string) => Promise<unknown>
    updateLabel: (id: number, label: string) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  resumeFiles: {
    getAll: () => Promise<unknown[]>
    create: (filename: string, label?: string) => Promise<unknown>
    updateLabel: (id: number, label: string) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  noteGroups: {
    getAll: () => Promise<unknown[]>
    create: (name: string) => Promise<unknown>
    update: (id: number, name: string) => Promise<unknown>
    delete: (id: number) => Promise<void>
  }
  notes: {
    listByGroup: (groupId: number) => Promise<unknown[]>
    create: (groupId: number, title: string) => Promise<unknown>
    update: (id: number, payload: unknown) => Promise<unknown>
    delete: (id: number) => Promise<void>
    exportNote: (title: string, content: string) => Promise<boolean>
    exportGroup: (groupName: string, noteList: { title: string; content: string }[]) => Promise<number>
    importFiles: (groupId: number) => Promise<unknown[]>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DbApi
  }
}
