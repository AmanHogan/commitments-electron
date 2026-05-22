import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  bcomm1: {
    getAll: () => ipcRenderer.invoke('bcomm1:getAll'),
    create: (payload: unknown) => ipcRenderer.invoke('bcomm1:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('bcomm1:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('bcomm1:delete', id)
  },
  dcomm1: {
    getAll: () => ipcRenderer.invoke('dcomm1:getAll'),
    create: (payload: unknown) => ipcRenderer.invoke('dcomm1:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('dcomm1:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('dcomm1:delete', id),
    getModules: (itemId: number) => ipcRenderer.invoke('dcomm1:getModules', itemId),
    createModule: (itemId: number, payload: unknown) => ipcRenderer.invoke('dcomm1:createModule', itemId, payload),
    updateModule: (moduleId: number, payload: unknown) => ipcRenderer.invoke('dcomm1:updateModule', moduleId, payload),
    deleteModule: (moduleId: number) => ipcRenderer.invoke('dcomm1:deleteModule', moduleId)
  },
  dcomm2: {
    getAll: () => ipcRenderer.invoke('dcomm2:getAll'),
    create: (payload: unknown) => ipcRenderer.invoke('dcomm2:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('dcomm2:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('dcomm2:delete', id),
    getSubEvents: (eventId: number) => ipcRenderer.invoke('dcomm2:getSubEvents', eventId),
    createSubEvent: (eventId: number, payload: unknown) => ipcRenderer.invoke('dcomm2:createSubEvent', eventId, payload),
    updateSubEvent: (subItemId: number, payload: unknown) => ipcRenderer.invoke('dcomm2:updateSubEvent', subItemId, payload),
    deleteSubEvent: (subItemId: number) => ipcRenderer.invoke('dcomm2:deleteSubEvent', subItemId)
  },
  bcomm2: {
    getAll: () => ipcRenderer.invoke('bcomm2:getAll'),
    create: (payload: unknown) => ipcRenderer.invoke('bcomm2:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('bcomm2:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('bcomm2:delete', id),
    getSubEvents: (eventId: number) => ipcRenderer.invoke('bcomm2:getSubEvents', eventId),
    createSubEvent: (eventId: number, payload: unknown) => ipcRenderer.invoke('bcomm2:createSubEvent', eventId, payload),
    updateSubEvent: (subEventId: number, payload: unknown) => ipcRenderer.invoke('bcomm2:updateSubEvent', subEventId, payload),
    deleteSubEvent: (subEventId: number) => ipcRenderer.invoke('bcomm2:deleteSubEvent', subEventId)
  },
  oneOnOne: {
    getAll: () => ipcRenderer.invoke('oneOnOne:getAll'),
    create: (payload: unknown) => ipcRenderer.invoke('oneOnOne:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('oneOnOne:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('oneOnOne:delete', id)
  },
  actionItems: {
    getAll: () => ipcRenderer.invoke('actionItems:getAll'),
    create: (payload: unknown) => ipcRenderer.invoke('actionItems:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('actionItems:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('actionItems:delete', id)
  },
  skills: {
    getAll: () => ipcRenderer.invoke('skills:getAll'),
    create: (payload: unknown) => ipcRenderer.invoke('skills:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('skills:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('skills:delete', id)
  },
  fcSets: {
    getAll: () => ipcRenderer.invoke('fcSets:getAll'),
    get: (id: number) => ipcRenderer.invoke('fcSets:get', id),
    create: (payload: unknown) => ipcRenderer.invoke('fcSets:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('fcSets:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('fcSets:delete', id),
    study: (id: number) => ipcRenderer.invoke('fcSets:study', id)
  },
  fcCards: {
    list: (setId: number) => ipcRenderer.invoke('fcCards:list', setId),
    create: (setId: number, payload: unknown) => ipcRenderer.invoke('fcCards:create', setId, payload),
    createBulk: (setId: number, payload: unknown) => ipcRenderer.invoke('fcCards:createBulk', setId, payload),
    update: (setId: number, cardId: number, payload: unknown) => ipcRenderer.invoke('fcCards:update', setId, cardId, payload),
    toggleStar: (setId: number, cardId: number) => ipcRenderer.invoke('fcCards:toggleStar', setId, cardId),
    delete: (setId: number, cardId: number) => ipcRenderer.invoke('fcCards:delete', setId, cardId),
    getStarredGrouped: () => ipcRenderer.invoke('fcCards:getStarredGrouped'),
    groups: (setId: number) => ipcRenderer.invoke('fcCards:groups', setId)
  },
  fcSkills: {
    list: () => ipcRenderer.invoke('fcSkills:list'),
    listBySet: (setId: number) => ipcRenderer.invoke('fcSkills:listBySet', setId),
    create: (payload: unknown) => ipcRenderer.invoke('fcSkills:create', payload),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('fcSkills:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('fcSkills:delete', id)
  },
  files: {
    save: (sourcePath: string) => ipcRenderer.invoke('files:save', sourcePath),
    delete: (filename: string) => ipcRenderer.invoke('files:delete', filename),
    openDialog: (filters: { name: string; extensions: string[] }[]) => ipcRenderer.invoke('files:openDialog', filters),
    getFileUrl: (filename: string) => ipcRenderer.invoke('files:getFileUrl', filename)
  },
  imageFiles: {
    getAll: () => ipcRenderer.invoke('imageFiles:getAll'),
    create: (filename: string, label?: string) => ipcRenderer.invoke('imageFiles:create', filename, label),
    updateLabel: (id: number, label: string) => ipcRenderer.invoke('imageFiles:updateLabel', id, label),
    delete: (id: number) => ipcRenderer.invoke('imageFiles:delete', id)
  },
  resumeFiles: {
    getAll: () => ipcRenderer.invoke('resumeFiles:getAll'),
    create: (filename: string, label?: string) => ipcRenderer.invoke('resumeFiles:create', filename, label),
    updateLabel: (id: number, label: string) => ipcRenderer.invoke('resumeFiles:updateLabel', id, label),
    delete: (id: number) => ipcRenderer.invoke('resumeFiles:delete', id)
  },
  data: {
    saveJson: (suggestedName: string, content: string) => ipcRenderer.invoke('data:saveJson', suggestedName, content),
    readJson: () => ipcRenderer.invoke('data:readJson')
  },
  notifications: {
    // Called by renderer once its listeners are mounted; returns upcoming items for the briefing
    rendererReady: () => ipcRenderer.invoke('notifications:rendererReady'),
    checkNow: () => ipcRenderer.invoke('notifications:checkNow'),
    onReminder: (callback: (data: unknown) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown) => callback(data)
      ipcRenderer.on('reminder:show', handler)
      return () => ipcRenderer.off('reminder:show', handler)
    },
    snooze: (id: number, minutes: number) => ipcRenderer.invoke('reminder:snooze', id, minutes),
    dismiss: (id: number) => ipcRenderer.invoke('reminder:dismiss', id),
  },
  noteGroups: {
    getAll: () => ipcRenderer.invoke('noteGroups:getAll'),
    create: (name: string) => ipcRenderer.invoke('noteGroups:create', name),
    update: (id: number, name: string) => ipcRenderer.invoke('noteGroups:update', id, name),
    delete: (id: number) => ipcRenderer.invoke('noteGroups:delete', id)
  },
  notes: {
    listByGroup: (groupId: number) => ipcRenderer.invoke('notes:listByGroup', groupId),
    create: (groupId: number, title: string) => ipcRenderer.invoke('notes:create', groupId, title),
    update: (id: number, payload: unknown) => ipcRenderer.invoke('notes:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id),
    exportNote: (title: string, content: string) => ipcRenderer.invoke('notes:exportNote', title, content),
    exportGroup: (groupName: string, noteList: { title: string; content: string }[]) => ipcRenderer.invoke('notes:exportGroup', groupName, noteList),
    importFiles: (groupId: number) => ipcRenderer.invoke('notes:importFiles', groupId)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
