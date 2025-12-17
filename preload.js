// preload.js
// ====================================================================
// PRELOAD.JS - Bridge entre le processus principal et le renderer
// ====================================================================

const { contextBridge, ipcRenderer } = require('electron');

// Exposer une API sécurisée au renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Sélection du dossier projet
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Obtenir le dossier projet actuel
  getProjectDirectory: () => ipcRenderer.invoke('get-project-directory'),
  
  // Lire un fichier CSV
  readCSVFile: (activityType, phase) => 
    ipcRenderer.invoke('read-csv-file', activityType, phase),
  
  // Écrire un fichier CSV
  writeCSVFile: (activityType, phase, content) => 
    ipcRenderer.invoke('write-csv-file', activityType, phase, content),
  
  // Lister les fichiers CSV disponibles
  listCSVFiles: () => ipcRenderer.invoke('list-csv-files'),

  // FONCTION D'EXPORT PDF (NOUVEAU)
  exportPDF: (fileName) => ipcRenderer.invoke('export-pdf', fileName)
});

// Indiquer que nous sommes dans Electron
contextBridge.exposeInMainWorld('isElectron', true);