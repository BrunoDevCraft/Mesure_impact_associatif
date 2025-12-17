// ====================================================================
// DASHBOARD.JS - Logique du Dashboard Multi-Activités
// VERSION CORRIGÉE - Gestion stricte des CSV et affichage conditionnel
// ====================================================================

// Variables globales
let directoryHandle = null;
let RAW_DATA = null;
let ALL_REMARQUES = [];
let CHARTS = {};
let HIDDEN_REMARKS_INDICES = new Set();
let CURRENT_ACTIVITY = null;

// Détection de l'environnement
const IS_ELECTRON = typeof window !== 'undefined' && window.isElectron;

// Clé de localStorage pour la persistance
const DISPLAY_SETTINGS_KEY = 'dashboardDisplaySettings_v2';

// ====================================================================
// SYSTÈME DE PRÉFÉRENCES D'AFFICHAGE (VERSION APLATIE)
// ====================================================================

// 1. Modifier DEFAULT_DISPLAY_SETTINGS pour inclure les KPIs principaux
const DEFAULT_DISPLAY_SETTINGS = {
  kpi: {
    showSatisfactionMoy: true,      // NOUVEAU
    showNPS: true,                  // NOUVEAU
    showAutonomie: true,            // NOUVEAU
    showConfiance: true,            // NOUVEAU
    showSatisfactionRate: true,
    showNonResponseRate: true,
    showDataAge: true,
    showQualityEngagement: true,
    showCommentDepth: true
  },
  demographics: {
    showAge: true,
    showGender: true,
    showOrigin: true,
    showProfessionalStatus: true,
    showEducationLevel: true
  },
  analysis: {
    showComparison: true,
    showEvolution: true
  },
  sections: {
    showRemarks: true
  }
};


let DISPLAY_SETTINGS = JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS));

// ====================================================================
// UTILITAIRES
// ====================================================================

function el(id) {
  return document.getElementById(id);
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.alert-box');
  if (existing) existing.remove();
  
  const alert = document.createElement('div');
  alert.className = `alert-box ${type}`;
  alert.textContent = message;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

function updateSplashMessage(msg) {
  const splashMsg = el('splash-message');
  if (splashMsg) splashMsg.textContent = msg;
}

function showSplash(show, message = 'Chargement...') {
  const splash = el('splash-screen');
  if (show) {
    el('splash-message').textContent = message;
    splash.style.opacity = '1';
    splash.style.display = 'flex';
  } else {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
    }, 400);
  }
}

function updateFolderStatus(active, name) {
  const status = el('folder-status');
  const indicator = status.querySelector('.status-indicator');
  indicator.classList.toggle('active', active);
  indicator.classList.toggle('inactive', !active);
  
  let textSpan = status.querySelector('.status-text');
  if (!textSpan) {
    textSpan = document.createElement('span');
    textSpan.className = 'status-text';
    status.appendChild(textSpan);
  }
  textSpan.textContent = active ? name : 'Aucun dossier';
  
  el('activity-selector').disabled = !active;
  el('process-data').disabled = !active;
  el('open-questionnaire').disabled = !active;
  el('export-report').disabled = !active || !RAW_DATA;
  
  const reloadButtons = document.querySelectorAll('#reload-data');
  reloadButtons.forEach(btn => {
    btn.disabled = !active;
  });
}

// ====================================================================
// GESTION DES PRÉFÉRENCES D'AFFICHAGE
// ====================================================================

function loadDisplaySettings() {
  try {
    const savedSettings = localStorage.getItem(DISPLAY_SETTINGS_KEY);
    if (savedSettings) {
      const loaded = JSON.parse(savedSettings);
      DISPLAY_SETTINGS = {
        kpi: { ...DEFAULT_DISPLAY_SETTINGS.kpi, ...(loaded.kpi || {}) },
        demographics: { ...DEFAULT_DISPLAY_SETTINGS.demographics, ...(loaded.demographics || {}) },
        analysis: { ...DEFAULT_DISPLAY_SETTINGS.analysis, ...(loaded.analysis || {}) },
        sections: { ...DEFAULT_DISPLAY_SETTINGS.sections, ...(loaded.sections || {}) }
      };
      console.log('✅ Préférences d\'affichage chargées:', DISPLAY_SETTINGS);
    }
  } catch (error) {
    console.error('❌ Erreur de chargement des paramètres d\'affichage:', error);
    DISPLAY_SETTINGS = JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS));
  }
}

// 2. Modifier la fonction saveDisplaySettings
function saveDisplaySettings() {
  try {
    const newSettings = {
      kpi: {
        showSatisfactionMoy: el('opt-satisfaction-moy')?.checked ?? true,
        showNPS: el('opt-nps')?.checked ?? true,
        showAutonomie: el('opt-autonomie')?.checked ?? true,
        showConfiance: el('opt-confiance')?.checked ?? true,
        showSatisfactionRate: el('opt-satisfaction-rate')?.checked ?? true,
        showNonResponseRate: el('opt-non-response-rate')?.checked ?? true,
        showDataAge: el('opt-data-age')?.checked ?? true,
        showQualityEngagement: el('opt-quality-engagement')?.checked ?? true,
        showCommentDepth: el('opt-comment-depth')?.checked ?? true
      },
      demographics: {
        showAge: el('opt-age')?.checked ?? true,
        showGender: el('opt-gender')?.checked ?? true,
        showOrigin: el('opt-origin')?.checked ?? true,
        showProfessionalStatus: el('opt-professional-status')?.checked ?? true,
        showEducationLevel: el('opt-education-level')?.checked ?? true
      },
      analysis: {
        showComparison: el('opt-comparison')?.checked ?? true,
        showEvolution: el('opt-evolution')?.checked ?? true
      },
      sections: {
        showRemarks: el('opt-remarks')?.checked ?? true
      }
    };

    DISPLAY_SETTINGS = newSettings;
    localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(newSettings));
    console.log('✅ Préférences sauvegardées:', DISPLAY_SETTINGS);
    
    applyDisplaySettings();
    showNotification('Préférences d\'affichage sauvegardées', 'success');
  } catch (error) {
    console.error('❌ Erreur de sauvegarde:', error);
    showNotification('Erreur lors de la sauvegarde des préférences', 'error');
  }
}



function applyDisplaySettings() {
  const settings = DISPLAY_SETTINGS;
  
  const kpiSection = el('section-kpis-universal');
  if (kpiSection) {
    const hasAnyKPI = Object.values(settings.kpi).some(v => v === true);
    kpiSection.classList.toggle('hidden', !hasAnyKPI);
  }
  
  const demoSection = el('section-demographics');
  if (demoSection) {
    const allDemoHidden = !settings.demographics.showAge && 
                          !settings.demographics.showGender && 
                          !settings.demographics.showOrigin &&
                          !settings.demographics.showProfessionalStatus &&
                          !settings.demographics.showEducationLevel;
    demoSection.classList.toggle('hidden', allDemoHidden);
  }
  
  const comparisonSection = el('section-comparison');
  if (comparisonSection) {
    comparisonSection.classList.toggle('hidden', !settings.analysis.showComparison);
  }
  
  const evolutionSection = el('specific-charts-container');
  if (evolutionSection) {
    evolutionSection.classList.toggle('hidden', !settings.analysis.showEvolution);
  }
  
  const remarksSection = el('section-remarques');
  if (remarksSection) {
    remarksSection.classList.toggle('hidden', !settings.sections.showRemarks);
  }
  
  if (RAW_DATA) {
    renderDashboard(CURRENT_ACTIVITY);
  }
}

// 3. Modifier openDisplayOptionsModal pour inclure les nouveaux KPIs
function openDisplayOptionsModal() {
  const settings = DISPLAY_SETTINGS;
  
  // KPIs principaux
  if (el('opt-satisfaction-moy')) el('opt-satisfaction-moy').checked = settings.kpi.showSatisfactionMoy;
  if (el('opt-nps')) el('opt-nps').checked = settings.kpi.showNPS;
  if (el('opt-autonomie')) el('opt-autonomie').checked = settings.kpi.showAutonomie;
  if (el('opt-confiance')) el('opt-confiance').checked = settings.kpi.showConfiance;
  
  // KPIs détaillés
  if (el('opt-satisfaction-rate')) el('opt-satisfaction-rate').checked = settings.kpi.showSatisfactionRate;
  if (el('opt-non-response-rate')) el('opt-non-response-rate').checked = settings.kpi.showNonResponseRate;
  if (el('opt-data-age')) el('opt-data-age').checked = settings.kpi.showDataAge;
  if (el('opt-quality-engagement')) el('opt-quality-engagement').checked = settings.kpi.showQualityEngagement;
  if (el('opt-comment-depth')) el('opt-comment-depth').checked = settings.kpi.showCommentDepth;
  
  // Démographie
  if (el('opt-age')) el('opt-age').checked = settings.demographics.showAge;
  if (el('opt-gender')) el('opt-gender').checked = settings.demographics.showGender;
  if (el('opt-origin')) el('opt-origin').checked = settings.demographics.showOrigin;
  if (el('opt-professional-status')) el('opt-professional-status').checked = settings.demographics.showProfessionalStatus;
  if (el('opt-education-level')) el('opt-education-level').checked = settings.demographics.showEducationLevel;
  
  // Analyse
  if (el('opt-comparison')) el('opt-comparison').checked = settings.analysis.showComparison;
  if (el('opt-evolution')) el('opt-evolution').checked = settings.analysis.showEvolution;
  
  // Remarques
  if (el('opt-remarks')) el('opt-remarks').checked = settings.sections.showRemarks;
  
  el('display-options-modal').classList.add('show');
}

function closeDisplayOptionsModal() {
  el('display-options-modal').classList.remove('show');
}

// ====================================================================
// GESTION IndexedDB & PERSISTANCE
// ====================================================================

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
        db.createObjectStore(CONFIG.STORE_NAME);
      }
    };
  });
}

async function saveToIndexedDB(key, value) {
  try {
    const db = await openDB();
    const tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
    const store = tx.objectStore(CONFIG.STORE_NAME);
    store.put(value, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch(e) {
    console.error('Erreur sauvegarde IndexedDB:', e);
    return false;
  }
}

async function loadFromIndexedDB(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
    const store = tx.objectStore(CONFIG.STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch(e) {
    console.error('Erreur lecture IndexedDB:', e);
    return null;
  }
}

async function loadHiddenRemarks() {
  const hiddenArray = await loadFromIndexedDB('hiddenRemarks');
  HIDDEN_REMARKS_INDICES = new Set(hiddenArray || []);
}

async function saveHiddenRemarks() {
  await saveToIndexedDB('hiddenRemarks', Array.from(HIDDEN_REMARKS_INDICES));
}

// ====================================================================
// GESTION DU DOSSIER PROJET
// ====================================================================

async function saveDirectoryHandle(dirInfo) {
  try {
    await saveToIndexedDB('hasDirectory', true);
    await saveToIndexedDB('directoryName', dirInfo.name);
    await saveToIndexedDB('directoryPath', dirInfo.path);
    directoryHandle = dirInfo;
    return true;
  } catch(e) {
    console.warn('Erreur sauvegarde dossier', e);
    return false;
  }
}

async function updateCurrentActivity(activityKey) {
  CURRENT_ACTIVITY = activityKey;
  el('activity-selector').value = activityKey;
  await saveToIndexedDB('currentActivity', activityKey);
  renderAll();
}

function loadActivitySelector() {
  const selector = el('activity-selector');
  selector.innerHTML = '';
  
  let globalOption = document.createElement('option');
  globalOption.value = 'all';
  globalOption.textContent = '🌍 Vue Globale (Comparaison)';
  selector.appendChild(globalOption);
  
  CONFIG.ACTIVITY_TYPES.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = CONFIG.ACTIVITY_LABELS[key];
    selector.appendChild(option);
  });
  
  const defaultActivity = CURRENT_ACTIVITY || 'all';
  selector.value = defaultActivity;
  
  if (directoryHandle) {
    selector.disabled = false;
  }
}

async function loadSavedDirectory() {
  let success = false;
  try {
    await loadHiddenRemarks();
    const hasDirectory = await loadFromIndexedDB('hasDirectory');
    const directoryName = await loadFromIndexedDB('directoryName');
    const directoryPath = await loadFromIndexedDB('directoryPath');
    const savedActivity = await loadFromIndexedDB('currentActivity');
    
    if (savedActivity) {
      CURRENT_ACTIVITY = savedActivity;
    }
    
    if (hasDirectory && IS_ELECTRON) {
      const result = await window.electronAPI.getProjectDirectory();
      
      if (result.success) {
        directoryHandle = result;
        updateFolderStatus(true, result.name);
        showNotification(`Dossier "${result.name}" reconnecté`, 'success');
        loadActivitySelector();
        await loadDataFromDirectory();
        success = true;
      } else if (directoryPath) {
        showNotification(`Dernier dossier: "${directoryName}". Veuillez le resélectionner.`, 'info');
      }
    } else if (hasDirectory && window._projectDirectory) {
      directoryHandle = window._projectDirectory;
      let permissionState = await directoryHandle.queryPermission({ mode: 'read' });
      
      if (permissionState !== 'granted') {
        permissionState = await directoryHandle.requestPermission({ mode: 'read' });
      }
      
      if (permissionState === 'granted') {
        updateFolderStatus(true, directoryName);
        showNotification(`Dossier "${directoryName}" reconnecté`, 'success');
        loadActivitySelector();
        await loadDataFromDirectory();
        success = true;
      } else {
        updateFolderStatus(false, '');
        showNotification('Permission refusée pour le dossier sauvegardé. Veuillez resélectionner.', 'warning');
      }
    }
    
    if (directoryName && !directoryHandle) {
      showNotification(`Dernier dossier: "${directoryName}". Veuillez le resélectionner.`, 'info');
    }
    
  } catch(e) {
    console.warn('Impossible de restaurer le dossier:', e);
    updateFolderStatus(false, '');
    showNotification('Erreur de restauration du dossier.', 'error');
  } finally {
    loadActivitySelector();
    if (!success) {
      showSplash(false);
    }
  }
}

async function chooseFolder() {
  if (IS_ELECTRON) {
    try {
      const result = await window.electronAPI.selectDirectory();
      
      if (result.success) {
        await saveDirectoryHandle(result);
        updateFolderStatus(true, result.name);
        showNotification(`Dossier "${result.name}" sélectionné`, 'success');
        loadActivitySelector();
        await loadDataFromDirectory();
      }
    } catch (err) {
      console.error('Erreur sélection dossier:', err);
      showNotification('Erreur lors de la sélection du dossier', 'error');
    }
  } else {
    if (!window.showDirectoryPicker) {
      alert('⚠️ API File System Access non supportée.\n\nUtilisez Chrome/Edge/Brave récent ou la version Electron.');
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      await saveDirectoryHandle({ name: handle.name, handle: handle });
      window._projectDirectory = handle;
      updateFolderStatus(true, handle.name);
      showNotification(`Dossier "${handle.name}" sélectionné`, 'success');
      loadActivitySelector();
      await loadDataFromDirectory();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur sélection dossier:', err);
        showNotification('Erreur lors de la sélection du dossier', 'error');
      }
    }
  }
}

// ====================================================================
// TRAITEMENT DES CSV AVEC VÉRIFICATION STRICTE
// ====================================================================

async function parseCSVContent(content) {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

function analyzeData(dataByPhase, activityType) {
  const allData = Object.values(dataByPhase).flat();
  const total = allData.length || 1;
  
  const availablePhases = {};
  Object.keys(dataByPhase).forEach(phase => {
    if (dataByPhase[phase] && dataByPhase[phase].length > 0) {
      availablePhases[phase] = true;
    }
  });
  
  const avgScore = (key) => {
    const values = allData.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };
  
  const countByPhase = (key) => {
    const values = dataByPhase[key] || [];
    return values.length;
  };
  
  const avantData = dataByPhase['avant'] || [];
  const apresData = dataByPhase['apres'] || [];
  
  const avgAutonomieAvant = avantData.length > 0
    ? avantData.reduce((sum, r) => sum + (parseFloat(r.autonomie_percue) || 0), 0) / avantData.length
    : 0;
    
  const avgAutonomieApres = apresData.length > 0
    ? apresData.reduce((sum, r) => sum + (parseFloat(r.autonomie_percue) || 0), 0) / apresData.length
    : 0;
    
  const avgConfianceAvant = avantData.length > 0
    ? avantData.reduce((sum, r) => sum + (parseFloat(r.confiance_en_soi) || 0), 0) / avantData.length
    : 0;
    
  const avgConfianceApres = apresData.length > 0
    ? apresData.reduce((sum, r) => sum + (parseFloat(r.confiance_en_soi) || 0), 0) / apresData.length
    : 0;
  
  const demographics = {
    age: {},
    genre: {},
    origine: {},
    statut_professionnel: {},
    niveau_etudes: {}
  };
  
  allData.forEach(r => {
    const age = parseInt(r.age);
    if (!isNaN(age)) {
      const ageGroup = age < 30 ? '18-30' : age < 50 ? '31-50' : '51+';
      demographics.age[ageGroup] = (demographics.age[ageGroup] || 0) + 1;
    }
    
    const genre = r.genre || r.Sexe;
    if (genre) {
      demographics.genre[genre] = (demographics.genre[genre] || 0) + 1;
    }
    
    const origine = r.origine || r.Origine;
    if (origine) {
      demographics.origine[origine] = (demographics.origine[origine] || 0) + 1;
    }
    
    const statut = r.statut_professionnel || r.Statut;
    if (statut) {
      demographics.statut_professionnel[statut] = (demographics.statut_professionnel[statut] || 0) + 1;
    }
    
    const etudes = r.niveau_etudes || r.Etudes;
    if (etudes) {
      demographics.niveau_etudes[etudes] = (demographics.niveau_etudes[etudes] || 0) + 1;
    }
  });
  
  const npsValues = allData.map(r => parseFloat(r.recommandation_nps)).filter(v => !isNaN(v));
  let npsScore = 0;
  if (npsValues.length > 0) {
    const promoters = npsValues.filter(v => v >= 9).length;
    const detractors = npsValues.filter(v => v <= 6).length;
    npsScore = ((promoters - detractors) / npsValues.length) * 100;
  }
  
  const satisfactionValues = allData.map(r => parseFloat(r.satisfaction_globale)).filter(v => !isNaN(v));
  const satisfiedCount = satisfactionValues.filter(v => v >= 4).length;
  const satisfactionRate = satisfactionValues.length > 0 
    ? ((satisfiedCount / satisfactionValues.length) * 100).toFixed(1) 
    : 0;
  
  const totalExpected = Object.keys(dataByPhase).reduce((sum, phase) => sum + (dataByPhase[phase]?.length || 0), 0);
  const nonResponseRate = totalExpected > 0 
    ? (((totalExpected - allData.length) / totalExpected) * 100).toFixed(1)
    : 0;
  
  const now = Date.now();
  let totalDataAge = 0;
  let dataWithTimestamp = 0;
  allData.forEach(r => {
    if (r.timestamp) {
      const timestampMs = new Date(r.timestamp).getTime();
      if (!isNaN(timestampMs)) {
        totalDataAge += (now - timestampMs) / (1000 * 60 * 60 * 24);
        dataWithTimestamp++;
      }
    }
  });
  const dataAge = dataWithTimestamp > 0 ? (totalDataAge / dataWithTimestamp).toFixed(1) : 0;
  
  let engagementCount = 0;
  let totalCommentLength = 0;
  let commentCount = 0;
  
  allData.forEach(r => {
    const remarque = r.remarques_ouvertes ? r.remarques_ouvertes.trim() : '';
    if (remarque && remarque !== 'Aucune remarque') {
      engagementCount++;
      totalCommentLength += remarque.length;
      commentCount++;
    }
  });
  
  const qualityEngagementRate = allData.length > 0 
    ? ((engagementCount / allData.length) * 100).toFixed(1)
    : 0;
  
  const commentDepth = commentCount > 0 
    ? (totalCommentLength / commentCount).toFixed(0)
    : 0;
  
  const remarques = allData
    .filter(r => r.remarques_ouvertes && r.remarques_ouvertes.trim())
    .map((r, i) => ({
      id: `${activityType}-${i}`,
      text: r.remarques_ouvertes,
      activity: activityType
    }));
  
  const comparisons = {};
  
  if (availablePhases['avant'] && availablePhases['apres']) {
    comparisons['Autonomie Perçue'] = {
      avant: avgAutonomieAvant,
      apres: avgAutonomieApres
    };
    
    comparisons['Confiance en Soi'] = {
      avant: avgConfianceAvant,
      apres: avgConfianceApres
    };
  }
  
  return {
    totalParticipants: allData.length,
    participantsByPhase: {
      avant: countByPhase('avant'),
      apres: countByPhase('apres'),
      suivi_3mois: countByPhase('suivi_3mois'),
      suivi_6mois: countByPhase('suivi_6mois')
    },
    availablePhases: availablePhases,
    demographics: demographics,
    transversal: {
      satisfaction_moyenne: {
        score: avgScore('satisfaction_globale') || 0,
        label: 'Satisfaction Moy.'
      },
      nps_score: {
        score: npsScore,
        label: 'NPS'
      },
      autonomie: {
        avant: avgAutonomieAvant,
        apres: avgAutonomieApres,
        label: 'Autonomie'
      },
      confiance: {
        avant: avgConfianceAvant,
        apres: avgConfianceApres,
        label: 'Confiance en soi'
      },
      satisfaction_rate: {
        score: parseFloat(satisfactionRate),
        label: 'Taux Satisfaction (≥4/5)'
      },
      non_response_rate: {
        score: parseFloat(nonResponseRate),
        label: 'Données Manquantes'
      },
      data_age: {
        score: parseFloat(dataAge),
        label: 'Ancienneté Données (j)'
      },
      quality_engagement_rate: {
        score: parseFloat(qualityEngagementRate),
        label: 'Engagement Qualitatif'
      },
      comment_depth: {
        score: parseFloat(commentDepth),
        label: 'Profondeur Remarques'
      }
    },
    activitySpecific: {},
    outcomes: {},
    comparisons: comparisons,
    remarques: remarques
  };
}

async function processActivityCSVs(activityType) {
  showSplash(true, `Chargement: ${CONFIG.ACTIVITY_LABELS[activityType]}`);
  const dataByPhase = {};
  
  try {
    for (const phase of CONFIG.PHASES) {
      try {
        if (IS_ELECTRON) {
          const result = await window.electronAPI.readCSVFile(activityType, phase);
          if (result.success && result.content) {
            const data = await parseCSVContent(result.content);
            dataByPhase[phase] = data;
            console.log(`✓ Chargé ${data.length} lignes pour ${activityType}/${phase}`);
          } else {
            dataByPhase[phase] = [];
          }
        } else {
          dataByPhase[phase] = [];
        }
      } catch (e) {
        console.log(`- Pas de fichier pour ${activityType}/${phase}`);
        dataByPhase[phase] = [];
      }
    }
    
    const analysisData = analyzeData(dataByPhase, activityType);
    return analysisData;
  } catch (e) {
    console.log(`Erreur traitement ${activityType}`, e);
    return null;
  }
}

async function processCSVFiles() {
  if (!directoryHandle) {
    showNotification('Veuillez d\'abord sélectionner un dossier de projet.', 'warning');
    return;
  }
  
  showSplash(true, 'Traitement des données en cours...');
  
  RAW_DATA = { activities: {}, global: { totalParticipants: 0 } };
  let globalTotal = 0;
  
  try {
    for (const activityType of CONFIG.ACTIVITY_TYPES) {
      updateSplashMessage(`Traitement: ${CONFIG.ACTIVITY_LABELS[activityType]}`);
      const analysisResult = await processActivityCSVs(activityType);
      
      if (analysisResult && analysisResult.totalParticipants > 0) {
        RAW_DATA.activities[activityType] = analysisResult;
        globalTotal += analysisResult.totalParticipants;
      }
    }
    
    RAW_DATA.global.totalParticipants = globalTotal;
    showNotification(`✅ Analyse terminée. Total participants: ${globalTotal}`, 'success');
    
    const lastUpdateEl = el('last-update');
    if (lastUpdateEl) {
      lastUpdateEl.textContent = new Date().toLocaleString('fr-FR');
    }
    
  } catch (e) {
    console.error('Erreur globale de traitement:', e);
    showNotification('Erreur lors du traitement des CSV. Voir console.', 'error');
  } finally {
    showSplash(false);
    el('export-report').disabled = !RAW_DATA;
    renderAll();
  }
}

async function loadDataFromDirectory() {
  await processCSVFiles();
}

// ====================================================================
// RENDU DES GRAPHIQUES AVEC VÉRIFICATION STRICTE
// ====================================================================

function renderChart(canvasId, type, data) {
  const canvas = el(canvasId);
  if (!canvas) return;

  if (CHARTS[canvasId]) {
    CHARTS[canvasId].destroy();
  }

  const ctx = canvas.getContext('2d');
  const config = {
    type: type,
    data: {
      labels: data.labels,
      datasets: data.datasets || [{
        data: data.values,
        backgroundColor: data.colors || CONFIG.COLORS.slice(0, data.labels.length),
        borderColor: data.borderColors || '#fff',
        borderWidth: type === 'doughnut' ? 2 : 1,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== undefined) {
                label += context.parsed.y.toFixed(2);
              } else if (context.parsed) {
                label += context.parsed;
              }
              return label;
            }
          }
        }
      }
    }
  };

  if (type === 'bar' || type === 'line') {
    config.options.scales = {
      y: {
        beginAtZero: true,
        max: data.max || undefined
      }
    };
  }

  CHARTS[canvasId] = new Chart(ctx, config);
}

function renderDemographics(demographics) {
  const container = el('demographics-container');
  container.innerHTML = '';
  
  const settings = DISPLAY_SETTINGS.demographics;
  
  if (settings.showAge) {
    const ageLabels = Object.keys(demographics.age || {});
    const ageValues = Object.values(demographics.age || {});
    const ageTotal = ageValues.reduce((a, b) => a + b, 0);

    if (ageTotal > 0) {
      container.innerHTML += '<div class="chart-half"><h4>Répartition par âge</h4><canvas id="ageChart"></canvas></div>';
      setTimeout(() => {
        renderChart('ageChart', 'doughnut', {
          labels: ageLabels,
          values: ageValues
        });
      }, 100);
    }
  }
  
  if (settings.showGender) {
    const genreLabels = Object.keys(demographics.genre || {});
    const genreValues = Object.values(demographics.genre || {});
    const genreTotal = genreValues.reduce((a, b) => a + b, 0);
    
    if (genreTotal > 0) {
      container.innerHTML += '<div class="chart-half"><h4>Genre</h4><canvas id="genreChart"></canvas></div>';
      setTimeout(() => {
        renderChart('genreChart', 'doughnut', {
          labels: genreLabels,
          values: genreValues
        });
      }, 100);
    }
  }
  
  if (settings.showOrigin) {
    const origineLabels = Object.keys(demographics.origine || {});
    const origineValues = Object.values(demographics.origine || {});
    const origineTotal = origineValues.reduce((a, b) => a + b, 0);
    
    if (origineTotal > 0) {
      container.innerHTML += '<div class="chart-half"><h4>Origine</h4><canvas id="origineChart"></canvas></div>';
      setTimeout(() => {
        renderChart('origineChart', 'doughnut', {
          labels: origineLabels,
          values: origineValues
        });
      }, 100);
    }
  }
  
  if (settings.showProfessionalStatus) {
    const statutLabels = Object.keys(demographics.statut_professionnel || {});
    const statutValues = Object.values(demographics.statut_professionnel || {});
    const statutTotal = statutValues.reduce((a, b) => a + b, 0);
    
    if (statutTotal > 0) {
      container.innerHTML += '<div class="chart-half"><h4>Statut Professionnel</h4><canvas id="statutChart"></canvas></div>';
      setTimeout(() => {
        renderChart('statutChart', 'doughnut', {
          labels: statutLabels,
          values: statutValues
        });
      }, 100);
    }
  }
  
  if (settings.showEducationLevel) {
    const etudesLabels = Object.keys(demographics.niveau_etudes || {});
    const etudesValues = Object.values(demographics.niveau_etudes || {});
    const etudesTotal = etudesValues.reduce((a, b) => a + b, 0);
    
    if (etudesTotal > 0) {
      container.innerHTML += '<div class="chart-half"><h4>Niveau d\'Études</h4><canvas id="etudesChart"></canvas></div>';
      setTimeout(() => {
        renderChart('etudesChart', 'doughnut', {
          labels: etudesLabels,
          values: etudesValues
        });
      }, 100);
    }
  }
  
  if (container.innerHTML === '') {
    container.innerHTML = '<p class="text-center mt-10">Aucune donnée démographique disponible.</p>';
  }
}

function renderAggregatedDemographics() {
  const container = el('demographics-container');
  container.innerHTML = '';
  
  if (!RAW_DATA || !RAW_DATA.activities) {
    container.innerHTML = '<p class="text-center mt-10">Aucune donnée disponible.</p>';
    return;
  }
  
  const settings = DISPLAY_SETTINGS.demographics;
  
  const aggregated = {
    age: {},
    genre: {},
    origine: {},
    statut_professionnel: {},
    niveau_etudes: {}
  };
  
  Object.values(RAW_DATA.activities).forEach(activityData => {
    if (activityData && activityData.demographics) {
      const demo = activityData.demographics;
      
      Object.keys(demo.age || {}).forEach(key => {
        aggregated.age[key] = (aggregated.age[key] || 0) + demo.age[key];
      });
      
      Object.keys(demo.genre || {}).forEach(key => {
        aggregated.genre[key] = (aggregated.genre[key] || 0) + demo.genre[key];
      });
      
      Object.keys(demo.origine || {}).forEach(key => {
        aggregated.origine[key] = (aggregated.origine[key] || 0) + demo.origine[key];
      });
      
      Object.keys(demo.statut_professionnel || {}).forEach(key => {
        aggregated.statut_professionnel[key] = (aggregated.statut_professionnel[key] || 0) + demo.statut_professionnel[key];
      });
      
      Object.keys(demo.niveau_etudes || {}).forEach(key => {
        aggregated.niveau_etudes[key] = (aggregated.niveau_etudes[key] || 0) + demo.niveau_etudes[key];
      });
    }
  });
  
  renderDemographics(aggregated);
}

// 4. Modifier renderUniversalKpis pour respecter les préférences
function renderUniversalKpis(transversalData) {
  const container = el('universal-kpis-container');
  container.innerHTML = '';
  
  const settings = DISPLAY_SETTINGS.kpi;
  
  const mainKpis = [
    { key: 'satisfaction_moyenne', setting: 'showSatisfactionMoy' },
    { key: 'nps_score', setting: 'showNPS' },
    { key: 'autonomie', setting: 'showAutonomie' },
    { key: 'confiance', setting: 'showConfiance' }
  ];
  
  mainKpis.forEach(({ key, setting }) => {
    if (settings[setting] && transversalData[key]) {
      const kpi = transversalData[key];
      const value = kpi.score !== undefined ? kpi.score : (kpi.apres - kpi.avant);
      const displayValue = kpi.score !== undefined 
        ? `${kpi.score.toFixed(1)}${key === 'nps_score' ? '%' : ''}`
        : `+${(value).toFixed(1)}`;

      const card = document.createElement('div');
      card.className = 'kpi-card-mini';
      card.innerHTML = `
        <span class="kpi-label">${kpi.label}</span>
        <span class="kpi-value">${displayValue}</span>
      `;
      container.appendChild(card);
    }
  });
  
  // KPIs détaillés
  if (settings.showSatisfactionRate && transversalData.satisfaction_rate) {
    const card = document.createElement('div');
    card.className = 'kpi-card-mini kpi-detail';
    card.innerHTML = `
      <span class="kpi-label">${transversalData.satisfaction_rate.label}</span>
      <span class="kpi-value">${transversalData.satisfaction_rate.score.toFixed(1)}%</span>
    `;
    container.appendChild(card);
  }
  
  if (settings.showNonResponseRate && transversalData.non_response_rate) {
    const card = document.createElement('div');
    card.className = 'kpi-card-mini kpi-detail';
    card.innerHTML = `
      <span class="kpi-label">${transversalData.non_response_rate.label}</span>
      <span class="kpi-value">${transversalData.non_response_rate.score.toFixed(1)}%</span>
    `;
    container.appendChild(card);
  }
  
  if (settings.showDataAge && transversalData.data_age) {
    const card = document.createElement('div');
    card.className = 'kpi-card-mini kpi-detail';
    card.innerHTML = `
      <span class="kpi-label">${transversalData.data_age.label}</span>
      <span class="kpi-value">${transversalData.data_age.score.toFixed(1)}j</span>
    `;
    container.appendChild(card);
  }
  
  if (settings.showQualityEngagement && transversalData.quality_engagement_rate) {
    const card = document.createElement('div');
    card.className = 'kpi-card-mini kpi-detail';
    card.innerHTML = `
      <span class="kpi-label">${transversalData.quality_engagement_rate.label}</span>
      <span class="kpi-value">${transversalData.quality_engagement_rate.score.toFixed(1)}%</span>
    `;
    container.appendChild(card);
  }
  
  if (settings.showCommentDepth && transversalData.comment_depth) {
    const card = document.createElement('div');
    card.className = 'kpi-card-mini kpi-detail';
    card.innerHTML = `
      <span class="kpi-label">${transversalData.comment_depth.label}</span>
      <span class="kpi-value">${transversalData.comment_depth.score.toFixed(0)} car.</span>
    `;
    container.appendChild(card);
  }
  
  if (container.children.length === 0) {
    container.innerHTML = '<p class="text-center mt-10">Aucun indicateur sélectionné. Activez des KPI dans les préférences.</p>';
  }
}
function renderComparisonChart() {
  const container = el('comparison-charts-container');
  container.innerHTML = '<h3>Comparaison des Activités (Évolution Avant/Après)</h3><div class="chart-wrapper"><canvas id="comparisonChart"></canvas></div>';
  
  const datasets = [];
  const labels = [];
  
  CONFIG.ACTIVITY_TYPES.forEach(activityType => {
    const data = RAW_DATA.activities[activityType];
    
    if (data && data.totalParticipants > 0 && data.comparisons && Object.keys(data.comparisons).length > 0) {
      labels.push(CONFIG.ACTIVITY_LABELS[activityType]);
    }
  });
  
  if (labels.length === 0) {
    container.innerHTML = '<p class="text-center mt-10">Aucune donnée de comparaison disponible (données avant/après manquantes).</p>';
    return;
  }
  
  const competenceKeys = new Set();
  Object.values(RAW_DATA.activities).forEach(activityData => {
    if (activityData && activityData.comparisons) {
      Object.keys(activityData.comparisons).forEach(key => competenceKeys.add(key));
    }
  });
  
  Array.from(competenceKeys).forEach((compKey, index) => {
    const dataAvant = [];
    const dataApres = [];
    
    CONFIG.ACTIVITY_TYPES.forEach(activityType => {
      const data = RAW_DATA.activities[activityType];
      if (data && data.totalParticipants > 0 && data.comparisons && data.comparisons[compKey]) {
        dataAvant.push(data.comparisons[compKey].avant);
        dataApres.push(data.comparisons[compKey].apres);
      }
    });

    if (dataAvant.length > 0) {
      datasets.push({
        label: `${compKey} - Avant`,
        data: dataAvant,
        backgroundColor: CONFIG.COLORS[index * 2],
        borderColor: CONFIG.COLORS[index * 2],
        borderWidth: 1
      });

      datasets.push({
        label: `${compKey} - Après`,
        data: dataApres,
        backgroundColor: CONFIG.COLORS[index * 2 + 1],
        borderColor: CONFIG.COLORS[index * 2 + 1],
        borderWidth: 1
      });
    }
  });

  if (datasets.length === 0) {
    container.innerHTML = '<p class="text-center mt-10">Aucune donnée de comparaison disponible.</p>';
    return;
  }

  renderChart('comparisonChart', 'bar', {
    labels: labels,
    datasets: datasets,
    max: 5
  });
}

function renderRemarque(remarque, index) {
  const li = document.createElement('li');
  li.className = 'remark-item';
  li.classList.toggle('hidden-remark', HIDDEN_REMARKS_INDICES.has(index));
  
  li.innerHTML = `
    <span class="remark-text">${remarque.text}</span>
    <span class="remark-source">(${CONFIG.ACTIVITY_LABELS[remarque.activity]})</span>
    <button class="btn btn-icon toggle-hide-btn" data-index="${index}" title="${HIDDEN_REMARKS_INDICES.has(index) ? 'Afficher' : 'Masquer'}">
      ${HIDDEN_REMARKS_INDICES.has(index) ? '👁️' : '🗑️'}
    </button>
  `;
  
  li.querySelector('.toggle-hide-btn').addEventListener('click', (e) => {
    toggleHideRemarque(index, e.currentTarget);
  });
  
  return li;
}

function displayRemarques(filteredRemarques) {
  const container = el('remarques-list');
  const countEl = el('remarques-count');
  container.innerHTML = '';

  if (filteredRemarques.length === 0) {
    container.innerHTML = '<li class="text-center mt-10">Aucune remarque trouvée.</li>';
    countEl.textContent = '0';
    return;
  }
  
  filteredRemarques.forEach((remarque) => {
    // On utilise l'index d'origine stocké dans l'objet remarque
    container.appendChild(renderRemarque(remarque, remarque.originalIndex));
  });
  
  countEl.textContent = filteredRemarques.length;
}

function filterRemarques(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const filterHidden = el('filter-hidden-remarks').checked;

  // 1. On mappe d'abord pour garder une trace de l'index réel
  const filtered = ALL_REMARQUES
    .map((remarque, index) => ({ ...remarque, originalIndex: index })) 
    .filter((remarque) => {
      const textMatch = normalizedQuery === '' || remarque.text.toLowerCase().includes(normalizedQuery);
      
      // 2. La logique de masquage utilise maintenant l'index d'origine
      const isHidden = HIDDEN_REMARKS_INDICES.has(remarque.originalIndex);
      const hiddenMatch = !filterHidden || !isHidden;
      
      return textMatch && hiddenMatch;
    });

  displayRemarques(filtered);
}

function toggleHideRemarque(index, button) {
  const li = button.closest('.remark-item');
  if (HIDDEN_REMARKS_INDICES.has(index)) {
    HIDDEN_REMARKS_INDICES.delete(index);
    li.classList.remove('hidden-remark');
    button.title = 'Masquer';
    button.innerHTML = '🗑️';
  } else {
    HIDDEN_REMARKS_INDICES.add(index);
    li.classList.add('hidden-remark');
    button.title = 'Afficher';
    button.innerHTML = '👁️';
  }
  saveHiddenRemarks();
  if (el('filter-hidden-remarks').checked) {
    filterRemarques(el('search-remarks').value);
  }
}

function renderEvolutionCharts(activityData) {
  const container = el('evolution-charts-container');
  
  if (!activityData || !activityData.comparisons || Object.keys(activityData.comparisons).length === 0) {
    container.innerHTML = '<p class="text-center mt-10">Données d\'évolution non disponibles (fichiers avant.csv et/ou apres.csv manquants).</p>';
    return;
  }
  
  container.innerHTML = '';
  let chartIndex = 0;
  
  Object.keys(activityData.comparisons).forEach((compKey) => {
    const comp = activityData.comparisons[compKey];
    
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart-half';
    chartDiv.innerHTML = `
      <h4>${compKey}</h4>
      <canvas id="evolutionChart${chartIndex}"></canvas>
    `;
    container.appendChild(chartDiv);
    
    const currentIndex = chartIndex;
    setTimeout(() => {
      renderChart(`evolutionChart${currentIndex}`, 'bar', {
        labels: ['Avant', 'Après'],
        datasets: [{
          label: compKey,
          data: [comp.avant, comp.apres],
          backgroundColor: [CONFIG.COLORS[0], CONFIG.COLORS[1]],
          borderColor: [CONFIG.COLORS[0], CONFIG.COLORS[1]],
          borderWidth: 1
        }],
        max: 5
      });
    }, 100);
    
    chartIndex++;
  });
  
  if (container.children.length === 0) {
    container.innerHTML = '<p class="text-center mt-10">Aucun graphique d\'évolution disponible.</p>';
  }
}

// 5. Modifier renderDashboard pour gérer l'affichage conditionnel des sections
function renderDashboard(activity) {
  const isGlobalView = activity === 'all';
  
  if (!RAW_DATA || !RAW_DATA.activities || Object.keys(RAW_DATA.activities).length === 0) {
    el('universal-kpis-container').textContent = '—';
    el('demographics-container').innerHTML = '<p class="text-center mt-10">Aucune donnée disponible.</p>';
    el('evolution-charts-container').innerHTML = '<p class="text-center mt-10">Aucune donnée disponible.</p>';
    displayRemarques([]);
    el('comparison-charts-container').innerHTML = '';
    
    // Gérer la visibilité des sections
    el('section-comparison').classList.add('hidden');
    el('specific-charts-container').classList.add('hidden');
    return;
  }
  
  if (isGlobalView) {
    // Vue globale : masquer évolution, afficher comparaison
    el('specific-charts-container').classList.add('hidden');
    el('section-comparison').classList.remove('hidden');
    
    el('universal-kpis-container').innerHTML = '<p class="text-center mt-10">Vue globale - Voir la comparaison ci-dessous</p>';
    
    renderAggregatedDemographics();
    
    if (DISPLAY_SETTINGS.analysis.showComparison) {
      renderComparisonChart();
    } else {
      el('comparison-charts-container').innerHTML = '<p class="text-center mt-10">Comparaison désactivée dans les préférences.</p>';
    }
    
    ALL_REMARQUES = Object.values(RAW_DATA.activities).flatMap(data => data.remarques || []);
    filterRemarques(el('search-remarks').value);
  } else {
    // Vue activité : masquer comparaison, afficher évolution
    el('section-comparison').classList.add('hidden');
    el('specific-charts-container').classList.remove('hidden');
    
    const activityData = RAW_DATA.activities[activity];
    if (!activityData || activityData.totalParticipants === 0) {
      showNotification(`Pas de données pour ${CONFIG.ACTIVITY_LABELS[activity]}`, 'warning');
      el('universal-kpis-container').innerHTML = '<p class="text-center mt-10">Aucune donnée disponible.</p>';
      el('demographics-container').innerHTML = '';
      el('evolution-charts-container').innerHTML = '';
      return;
    }

    renderUniversalKpis(activityData.transversal);
    renderDemographics(activityData.demographics);
    
    if (DISPLAY_SETTINGS.analysis.showEvolution) {
      renderEvolutionCharts(activityData);
    } else {
      el('evolution-charts-container').innerHTML = '<p class="text-center mt-10">Évolution désactivée dans les préférences.</p>';
    }
    
    ALL_REMARQUES = activityData.remarques || [];
    filterRemarques(el('search-remarks').value);
  }
}
function renderAll() {
  const activity = el('activity-selector').value || CURRENT_ACTIVITY || 'all';
  CURRENT_ACTIVITY = activity;
  saveToIndexedDB('currentActivity', activity);
  renderDashboard(activity);
}

async function exportReport() {
  if (!RAW_DATA) {
    showNotification("Veuillez charger les données avant d'exporter.", 'warning');
    return;
  }
  
  showNotification('Génération du rapport PDF...', 'info');
  
  try {
    const activityLabel = CURRENT_ACTIVITY === 'all'
      ? 'Global'
      : CONFIG.ACTIVITY_LABELS[CURRENT_ACTIVITY].replace(/[^a-zA-Z0-9]/g, '');
    const defaultFileName = `Dashboard_Impact_${activityLabel}`;

    const result = await window.electronAPI.exportPDF(defaultFileName); 

    if (result.success) {
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'warning');
    }
  } catch (error) {
    console.error("Erreur inattendue d'export:", error);
    showNotification("Erreur critique lors de l'export du rapport.", 'error');
  }
}

window.addEventListener('load', async () => {
  if (typeof CONFIG === 'undefined') {
    alert("Erreur: Le fichier config.js n'a pas été chargé. Veuillez vérifier l'index.html.");
    return;
  }
  
  loadDisplaySettings();
  applyDisplaySettings();
  
  el('choose-folder').addEventListener('click', chooseFolder);
  el('process-data').addEventListener('click', async () => {
    if (directoryHandle) {
      await loadDataFromDirectory();
    } else {
      showNotification("Sélectionnez d'abord le dossier projet", 'error');
    }
  });
  
  const reloadButtons = document.querySelectorAll('#reload-data');
  reloadButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (directoryHandle) {
        await loadDataFromDirectory();
      } else {
        showNotification("Sélectionnez d'abord le dossier projet", 'error');
      }
    });
  });
  
  el('activity-selector').addEventListener('change', (e) => updateCurrentActivity(e.target.value));
  el('export-report').addEventListener('click', exportReport);
  
  el('open-questionnaire').addEventListener('click', () => {
    if (IS_ELECTRON) {
      window.location.href = 'questionnaire.html';
    } else {
      el('questionnaire-modal').classList.add('show');
    }
  });
  
  const closeModalBtn = el('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      el('questionnaire-modal').classList.remove('show');
    });
  }
  
  const questionnaireModal = el('questionnaire-modal');
  if (questionnaireModal) {
    questionnaireModal.addEventListener('click', (e) => {
      if (e.target === questionnaireModal) {
        questionnaireModal.classList.remove('show');
      }
    });
  }
  
  el('open-display-options').addEventListener('click', openDisplayOptionsModal);
  
  el('save-display-options').addEventListener('click', () => {
    saveDisplaySettings();
    closeDisplayOptionsModal();
  });
  
  const cancelBtn = el('cancel-display-options');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDisplayOptionsModal);
  }
  
  const displayModal = el('display-options-modal');
  if (displayModal) {
    displayModal.addEventListener('click', (e) => {
      if (e.target === displayModal) {
        closeDisplayOptionsModal();
      }
    });
  }
  
  el('search-remarks').addEventListener('input', (e) => filterRemarques(e.target.value));
  el('filter-hidden-remarks').addEventListener('change', (e) => filterRemarques(el('search-remarks').value));
  
  await loadSavedDirectory();
});