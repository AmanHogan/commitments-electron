import { app, shell, BrowserWindow, ipcMain, protocol, net, dialog } from 'electron'
import { join, extname, basename } from 'path'
import { pathToFileURL } from 'url'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { bcomm1, bcomm2, dcomm1, dcomm2, oneOnOne, actionItems, skills, fcSets, fcCards, fcSkills, imageFiles, resumeFiles, noteGroups, notes } from './database'

// Register before app.whenReady
protocol.registerSchemesAsPrivileged([
  { scheme: 'local', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    title: 'Commitment Tracker',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.commitments')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ─── Local file protocol ──────────────────────────────────────────────────────
  const uploadsDir = join(app.getPath('userData'), 'uploads')
  fs.mkdirSync(uploadsDir, { recursive: true })

  protocol.handle('local', (request) => {
    const url = new URL(request.url)
    const filename = decodeURIComponent(url.pathname.slice(1))
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response('Forbidden', { status: 403 })
    }
    return net.fetch(pathToFileURL(join(uploadsDir, filename)).toString())
  })

  // ─── File operations ──────────────────────────────────────────────────────────
  ipcMain.handle('files:save', async (_, sourcePath: string) => {
    const ext = extname(sourcePath).toLowerCase()
    const savedFilename = `${Date.now()}${ext}`
    await fs.promises.copyFile(sourcePath, join(uploadsDir, savedFilename))
    return savedFilename
  })

  ipcMain.handle('files:delete', async (_, filename: string) => {
    try { await fs.promises.unlink(join(uploadsDir, filename)) } catch {}
  })

  ipcMain.handle('files:openDialog', async (_, filters: Electron.FileFilter[]) => {
    const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('files:getFileUrl', (_: Electron.IpcMainInvokeEvent, filename: string) => {
    return pathToFileURL(join(uploadsDir, filename)).toString()
  })

  // ─── Business Commitments One ────────────────────────────────────────────────
  ipcMain.handle('bcomm1:getAll', () => bcomm1.getAll())
  ipcMain.handle('bcomm1:create', (_, payload) => bcomm1.create(payload))
  ipcMain.handle('bcomm1:update', (_, id, payload) => bcomm1.update(id, payload))
  ipcMain.handle('bcomm1:delete', (_, id) => bcomm1.delete(id))

  // ─── Development Commitments One ─────────────────────────────────────────────
  ipcMain.handle('dcomm1:getAll', () => dcomm1.getAll())
  ipcMain.handle('dcomm1:create', (_, payload) => dcomm1.create(payload))
  ipcMain.handle('dcomm1:update', (_, id, payload) => dcomm1.update(id, payload))
  ipcMain.handle('dcomm1:delete', (_, id) => dcomm1.delete(id))
  ipcMain.handle('dcomm1:getModules', (_, itemId) => dcomm1.getModules(itemId))
  ipcMain.handle('dcomm1:createModule', (_, itemId, payload) => dcomm1.createModule(itemId, payload))
  ipcMain.handle('dcomm1:updateModule', (_, moduleId, payload) => dcomm1.updateModule(moduleId, payload))
  ipcMain.handle('dcomm1:deleteModule', (_, moduleId) => dcomm1.deleteModule(moduleId))

  // ─── Development Commitments Two ─────────────────────────────────────────────
  ipcMain.handle('dcomm2:getAll', () => dcomm2.getAll())
  ipcMain.handle('dcomm2:create', (_, payload) => dcomm2.create(payload))
  ipcMain.handle('dcomm2:update', (_, id, payload) => dcomm2.update(id, payload))
  ipcMain.handle('dcomm2:delete', (_, id) => dcomm2.delete(id))
  ipcMain.handle('dcomm2:getSubEvents', (_, eventId) => dcomm2.getSubEvents(eventId))
  ipcMain.handle('dcomm2:createSubEvent', (_, eventId, payload) => dcomm2.createSubEvent(eventId, payload))
  ipcMain.handle('dcomm2:updateSubEvent', (_, subItemId, payload) => dcomm2.updateSubEvent(subItemId, payload))
  ipcMain.handle('dcomm2:deleteSubEvent', (_, subItemId) => dcomm2.deleteSubEvent(subItemId))

  // ─── Business Commitments Two ─────────────────────────────────────────────────
  ipcMain.handle('bcomm2:getAll', () => bcomm2.getAll())
  ipcMain.handle('bcomm2:create', (_, payload) => bcomm2.create(payload))
  ipcMain.handle('bcomm2:update', (_, id, payload) => bcomm2.update(id, payload))
  ipcMain.handle('bcomm2:delete', (_, id) => bcomm2.delete(id))
  ipcMain.handle('bcomm2:getSubEvents', (_, eventId) => bcomm2.getSubEvents(eventId))
  ipcMain.handle('bcomm2:createSubEvent', (_, eventId, payload) => bcomm2.createSubEvent(eventId, payload))
  ipcMain.handle('bcomm2:updateSubEvent', (_, subEventId, payload) => bcomm2.updateSubEvent(subEventId, payload))
  ipcMain.handle('bcomm2:deleteSubEvent', (_, subEventId) => bcomm2.deleteSubEvent(subEventId))

  // ─── One on One ───────────────────────────────────────────────────────────────
  ipcMain.handle('oneOnOne:getAll', () => oneOnOne.getAll())
  ipcMain.handle('oneOnOne:create', (_, payload) => oneOnOne.create(payload))
  ipcMain.handle('oneOnOne:update', (_, id, payload) => oneOnOne.update(id, payload))
  ipcMain.handle('oneOnOne:delete', (_, id) => oneOnOne.delete(id))

  // ─── Action Items ─────────────────────────────────────────────────────────────
  ipcMain.handle('actionItems:getAll', () => actionItems.getAll())
  ipcMain.handle('actionItems:create', (_, payload) => actionItems.create(payload))
  ipcMain.handle('actionItems:update', (_, id, payload) => actionItems.update(id, payload))
  ipcMain.handle('actionItems:delete', (_, id) => actionItems.delete(id))

  // ─── Skills ───────────────────────────────────────────────────────────────────
  ipcMain.handle('skills:getAll', () => skills.getAll())
  ipcMain.handle('skills:create', (_, payload) => skills.create(payload))
  ipcMain.handle('skills:update', (_, id, payload) => skills.update(id, payload))
  ipcMain.handle('skills:delete', (_, id) => skills.delete(id))

  // ─── Flash Card Sets ──────────────────────────────────────────────────────────
  ipcMain.handle('fcSets:getAll', () => fcSets.getAll())
  ipcMain.handle('fcSets:get', (_, id) => fcSets.get(id))
  ipcMain.handle('fcSets:create', (_, payload) => fcSets.create(payload))
  ipcMain.handle('fcSets:update', (_, id, payload) => fcSets.update(id, payload))
  ipcMain.handle('fcSets:delete', (_, id) => fcSets.delete(id))
  ipcMain.handle('fcSets:study', (_, id) => fcSets.study(id))

  // ─── Flash Cards ──────────────────────────────────────────────────────────────
  ipcMain.handle('fcCards:list', (_, setId) => fcCards.list(setId))
  ipcMain.handle('fcCards:create', (_, setId, payload) => fcCards.create(setId, payload))
  ipcMain.handle('fcCards:createBulk', (_, setId, payload) => fcCards.createBulk(setId, payload))
  ipcMain.handle('fcCards:update', (_, setId, cardId, payload) => fcCards.update(setId, cardId, payload))
  ipcMain.handle('fcCards:toggleStar', (_, setId, cardId) => fcCards.toggleStar(setId, cardId))
  ipcMain.handle('fcCards:delete', (_, setId, cardId) => fcCards.delete(setId, cardId))
  ipcMain.handle('fcCards:getStarredGrouped', () => fcCards.getStarredGrouped())
  ipcMain.handle('fcCards:groups', (_, setId) => fcCards.groups(setId))

  // ─── FC Skills ────────────────────────────────────────────────────────────────
  ipcMain.handle('fcSkills:list', () => fcSkills.list())
  ipcMain.handle('fcSkills:listBySet', (_, setId) => fcSkills.listBySet(setId))
  ipcMain.handle('fcSkills:create', (_, payload) => fcSkills.create(payload))
  ipcMain.handle('fcSkills:update', (_, id, payload) => fcSkills.update(id, payload))
  ipcMain.handle('fcSkills:delete', (_, id) => fcSkills.delete(id))

  // ─── Image Files ──────────────────────────────────────────────────────────────
  ipcMain.handle('imageFiles:getAll', () => imageFiles.getAll())
  ipcMain.handle('imageFiles:create', (_, filename, label) => imageFiles.create(filename, label))
  ipcMain.handle('imageFiles:updateLabel', (_, id, label) => imageFiles.updateLabel(id, label))
  ipcMain.handle('imageFiles:delete', (_, id) => imageFiles.delete(id))

  // ─── Resume Files ─────────────────────────────────────────────────────────────
  ipcMain.handle('resumeFiles:getAll', () => resumeFiles.getAll())
  ipcMain.handle('resumeFiles:create', (_, filename, label) => resumeFiles.create(filename, label))
  ipcMain.handle('resumeFiles:updateLabel', (_, id, label) => resumeFiles.updateLabel(id, label))
  ipcMain.handle('resumeFiles:delete', (_, id) => resumeFiles.delete(id))

  // ─── JSON data transfer ───────────────────────────────────────────────────────
  ipcMain.handle('data:saveJson', async (_, suggestedName: string, content: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: suggestedName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return false
    await fs.promises.writeFile(result.filePath, content, 'utf-8')
    return true
  })

  ipcMain.handle('data:readJson', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    return fs.promises.readFile(result.filePaths[0], 'utf-8')
  })

  // ─── Note Groups ──────────────────────────────────────────────────────────────
  ipcMain.handle('noteGroups:getAll', () => noteGroups.getAll())
  ipcMain.handle('noteGroups:create', (_, name) => noteGroups.create(name))
  ipcMain.handle('noteGroups:update', (_, id, name) => noteGroups.update(id, name))
  ipcMain.handle('noteGroups:delete', (_, id) => noteGroups.delete(id))

  // ─── Notes ────────────────────────────────────────────────────────────────────
  ipcMain.handle('notes:listByGroup', (_, groupId) => notes.listByGroup(groupId))
  ipcMain.handle('notes:create', (_, groupId, title) => notes.create(groupId, title))
  ipcMain.handle('notes:update', (_, id, payload) => notes.update(id, payload))
  ipcMain.handle('notes:delete', (_, id) => notes.delete(id))

  ipcMain.handle('notes:exportNote', async (_, title: string, content: string) => {
    const safe = title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'note'
    const result = await dialog.showSaveDialog({ defaultPath: `${safe}.md`, filters: [{ name: 'Markdown', extensions: ['md'] }] })
    if (result.canceled || !result.filePath) return false
    await fs.promises.writeFile(result.filePath, content, 'utf-8')
    return true
  })

  ipcMain.handle('notes:exportGroup', async (_, _groupName: string, noteList: { title: string; content: string }[]) => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'], title: 'Choose export folder' })
    if (result.canceled || !result.filePaths[0]) return 0
    const dir = result.filePaths[0]
    for (const note of noteList) {
      const safe = note.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'untitled'
      await fs.promises.writeFile(join(dir, `${safe}.md`), note.content, 'utf-8')
    }
    return noteList.length
  })

  ipcMain.handle('notes:importFiles', async (_, groupId: number) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Markdown / Text', extensions: ['md', 'txt'] }]
    })
    if (result.canceled) return []
    const created: unknown[] = []
    for (const filePath of result.filePaths) {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const title = basename(filePath).replace(/\.[^/.]+$/, '')
      const note = notes.create(groupId, title) as Record<string, unknown>
      created.push(notes.update(note.id as number, { content }))
    }
    return created
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
