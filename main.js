// main.js
// ====================================================================
// MAIN.JS - Processus principal Electron
// ====================================================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let selectedProjectDirectory = null;

// ====================================================================
// CRÉATION DE LA FENÊTRE PRINCIPALE
// ====================================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'src', 'icon.png'),
    title: 'Dashboard Impact Multi-Activités'
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Ouvrir DevTools en développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ====================================================================
// GESTION DES ÉVÉNEMENTS IPC
// ====================================================================

// Sélection du dossier projet
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Sélectionner le dossier projet'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    selectedProjectDirectory = result.filePaths[0];
    return {
      success: true,
      path: selectedProjectDirectory,
      name: path.basename(selectedProjectDirectory)
    };
  }

  return { success: false };
});

// Obtenir le dossier projet actuel
ipcMain.handle('get-project-directory', async () => {
  if (selectedProjectDirectory) {
    return {
      success: true,
      path: selectedProjectDirectory,
      name: path.basename(selectedProjectDirectory)
    };
  }
  return { success: false };
});

// Lire un fichier CSV
ipcMain.handle('read-csv-file', async (event, activityType, phase) => {
  if (!selectedProjectDirectory) {
    return { success: false, error: 'Aucun dossier projet sélectionné' };
  }

  try {
    const activityDir = path.join(selectedProjectDirectory, 'data', `reponses_${activityType}`);
    const filePath = path.join(activityDir, `${phase}.csv`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, content: '' }; // Fichier n'existe pas encore
    }
    return { success: false, error: error.message };
  }
});

// Écrire un fichier CSV
ipcMain.handle('write-csv-file', async (event, activityType, phase, content) => {
  if (!selectedProjectDirectory) {
    return { success: false, error: 'Aucun dossier projet sélectionné' };
  }

  try {
    const dataDir = path.join(selectedProjectDirectory, 'data');
    const activityDir = path.join(dataDir, `reponses_${activityType}`);
    const filePath = path.join(activityDir, `${phase}.csv`);

    // Créer les dossiers si nécessaire
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(activityDir, { recursive: true });

    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Lister les fichiers CSV disponibles (CORRIGÉ)
ipcMain.handle('list-csv-files', async () => {
  if (!selectedProjectDirectory) {
    return { success: false, error: 'Aucun dossier projet sélectionné' };
  }

  try {
    const dataDir = path.join(selectedProjectDirectory, 'data');
    const activities = {};

    try {
      await fs.access(dataDir);
    } catch {
      return { success: true, activities: {} };
    }

    const dirs = await fs.readdir(dataDir);
    
    for (const dir of dirs) {
      // Éviter les dossiers cachés (ex: .DS_Store ou dossiers système)
      if (dir.startsWith('.') || !dir.startsWith('reponses_')) continue;

      const activityType = dir.replace('reponses_', '');
      const activityPath = path.join(dataDir, dir);
      const files = await fs.readdir(activityPath);
      
      // FILTRE ICI : On ignore les fichiers qui commencent par "." 
      // et on ne garde que les .csv
      activities[activityType] = files.filter(f => {
        return !f.startsWith('.') && f.endsWith('.csv');
      });
    }

    return { success: true, activities };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ====================================================================
// GESTION DE L'EXPORT PDF AMÉLIORÉ
// ====================================================================

ipcMain.handle('export-pdf', async (event, defaultFileName) => {
  const webContents = mainWindow.webContents;
  
  // 1. Demander à l'utilisateur où enregistrer le fichier
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `${defaultFileName || 'Rapport_Impact'}_${new Date().toISOString().slice(0, 10)}.pdf`,
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
  });

  if (!filePath) {
    return { success: false, message: 'Sauvegarde annulée par l\'utilisateur.' };
  }

  try {
    // 2. Injecter le CSS d'impression avant la génération
    await webContents.insertCSS(`
      @media print {
        /* Masquer les éléments de navigation */
        .page-header,
        .controls,
        .page-footer,
        .modal,
        #splash-screen,
        .btn,
        button,
        .toggle-hide-btn {
          display: none !important;
        }
        
        /* Optimiser les cartes pour l'impression */
        body {
          background: white !important;
          color: black !important;
          font-size: 10pt;
        }
        
        .dashboard-grid {
          display: block !important;
          padding: 0 !important;
        }
        
        .card {
          page-break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #ddd;
          box-shadow: none !important;
        }
        
        .card h3 {
          font-size: 14pt;
          margin-bottom: 10px;
          color: #007bff;
          border-bottom: 2px solid #007bff;
        }
        
        /* KPIs en ligne pour économiser l'espace */
        .kpi-grid {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 10px !important;
        }
        
        .kpi-card-mini {
          flex: 0 1 auto !important;
          min-width: 120px !important;
          padding: 8px 12px !important;
          font-size: 9pt !important;
        }
        
        .kpi-card-mini .kpi-value {
          font-size: 14pt !important;
        }
        
        /* Graphiques */
        .chart-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 15px !important;
        }
        
        .chart-half {
          page-break-inside: avoid;
        }
        
        .chart-half h4 {
          font-size: 11pt;
          margin-bottom: 8px;
        }
        
        canvas {
          max-height: 250px !important;
        }
        
        /* Remarques */
        .remarks-list {
          max-height: none !important;
          overflow: visible !important;
        }
        
        .remark-item {
          page-break-inside: avoid;
          margin: 8px 0;
          padding: 8px;
          font-size: 9pt;
        }
        
        .hidden-remark {
          display: none !important;
        }
        
        /* En-tête du rapport */
        .dashboard-grid::before {
          content: "Dashboard Impact Multi-Activités - Rapport d'analyse";
          display: block;
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
          color: #007bff;
        }
        
        /* Numérotation des pages */
        @page {
          margin: 2cm 1.5cm;
          size: A4 portrait;
          
          @top-right {
            content: "Page " counter(page) " sur " counter(pages);
            font-size: 9pt;
            color: #666;
          }
          
          @bottom-center {
            content: "Généré le " attr(data-date);
            font-size: 8pt;
            color: #999;
          }
        }
        
        /* Forcer les sauts de page stratégiques */
        #section-comparison,
        #specific-charts-container,
        #section-demographics {
          page-break-before: always;
        }
        
        /* Éviter les veuves et orphelines */
        p, li {
          orphans: 3;
          widows: 3;
        }
        
        h3, h4 {
          page-break-after: avoid;
        }
      }
    `);
    
    // 3. Générer le PDF avec des options optimisées
    const pdfBuffer = await webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      landscape: false,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-size: 9px; text-align: center; color: #666; margin-top: 10px;">
          <span>Dashboard Impact Multi-Activités</span>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-size: 8px; text-align: center; color: #999; margin-bottom: 10px;">
          <span>Généré le ${new Date().toLocaleDateString('fr-FR')} - Page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
        </div>
      `,
      margins: {
        top: 0.8,    // en inches (environ 2cm)
        bottom: 0.8,
        left: 0.6,   // en inches (environ 1.5cm)
        right: 0.6
      },
      preferCSSPageSize: false,
      scale: 0.85 // Légère réduction pour optimiser l'espace
    });

    // 4. Écrire le fichier
    await fs.writeFile(filePath, pdfBuffer);
    
    return { 
      success: true, 
      message: `Rapport exporté avec succès vers ${filePath}`,
      path: filePath
    };
    
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    return { 
      success: false, 
      message: `Échec de l'export: ${error.message}` 
    };
  }
});

// ====================================================================
// ÉVÉNEMENTS DE L'APPLICATION
// ====================================================================

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});