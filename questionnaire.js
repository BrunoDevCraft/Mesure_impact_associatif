// ====================================================================
// QUESTIONNAIRE.JS - Gestion du formulaire (VERSION ELECTRON)
// CORRIGÉ : Ajout des champs origine et niveau_etudes
// ====================================================================

let directoryHandle = null;
let currentActivity = null;
let currentPhase = null;

// Détection de l'environnement
const IS_ELECTRON = typeof window !== 'undefined' && window.isElectron;

// ====================================================================
// UTILITAIRES
// ====================================================================

function el(id) {
  return document.getElementById(id);
}

function showNotification(message, type = 'info') {
  const notifArea = el('notification-area');
  const alert = document.createElement('div');
  alert.className = `alert-box ${type}`;
  alert.textContent = message;
  alert.style.marginBottom = '10px';
  notifArea.appendChild(alert);
  
  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

// ====================================================================
// GESTION IndexedDB
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

// ====================================================================
// CHARGEMENT DU DOSSIER PROJET
// ====================================================================

async function loadSavedDirectory() {
  try {
    const hasDirectory = await loadFromIndexedDB('hasDirectory');
    const directoryName = await loadFromIndexedDB('directoryName');
    
    if (hasDirectory && IS_ELECTRON) {
      const result = await window.electronAPI.getProjectDirectory();
      
      if (result.success) {
        directoryHandle = result;
        updateFolderDisplay(true, result.name);
        showNotification(`Dossier "${result.name}" reconnecté`, 'success');
        return true;
      }
    } else if (hasDirectory && window._projectDirectory) {
      directoryHandle = window._projectDirectory;
      let permissionState = await directoryHandle.queryPermission({ mode: 'readwrite' });
      if (permissionState !== 'granted') {
        permissionState = await directoryHandle.requestPermission({ mode: 'readwrite' });
      }
      if (permissionState === 'granted') {
        updateFolderDisplay(true, directoryName);
        showNotification(`Dossier "${directoryName}" reconnecté`, 'success');
        return true;
      }
    }
    
    if (directoryName && !directoryHandle) {
      showNotification(`Veuillez sélectionner le dossier projet`, 'warning');
    }
    return false;
  } catch(e) {
    console.warn('Impossible de restaurer le dossier:', e);
    return false;
  }
}

function updateFolderDisplay(active, name) {
  const statusIndicator = document.querySelector('#folder-selection-status .status-indicator');
  const folderNameDisplay = el('folder-name-display');
  const statusBox = document.querySelector('#folder-selection-status .status-box');
  
  if (statusIndicator && folderNameDisplay && statusBox) {
    if (active) {
      statusIndicator.classList.remove('inactive');
      statusIndicator.classList.add('active');
      statusBox.style.background = '#d4edda';
      folderNameDisplay.textContent = name;
    } else {
      statusIndicator.classList.remove('active');
      statusIndicator.classList.add('inactive');
      statusBox.style.background = '#f8d7da';
      folderNameDisplay.textContent = 'Aucun dossier sélectionné';
    }
  }
}

// ====================================================================
// GÉNÉRATION DYNAMIQUE DU FORMULAIRE
// ====================================================================

function populateActivitySelector() {
  const selector = el('activity-type');
  selector.innerHTML = '<option value="" disabled selected>Choisir une activité...</option>';
  
  CONFIG.ACTIVITY_TYPES.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = CONFIG.ACTIVITY_LABELS[key];
    selector.appendChild(option);
  });
}

function populatePhaseSelector() {
  const selector = el('questionnaire-phase');
  selector.innerHTML = '<option value="" disabled selected>Choisir une phase...</option>';
  
  CONFIG.PHASES.forEach(phase => {
    const option = document.createElement('option');
    option.value = phase;
    option.textContent = CONFIG.PHASE_LABELS[phase];
    selector.appendChild(option);
  });
}

function generateSatisfactionScale() {
  const container = el('satisfaction-group');
  container.innerHTML = '';
  
  for (let i = 1; i <= 5; i++) {
    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `satisfaction_${i}`;
    input.name = 'satisfaction_globale';
    input.value = i;
    input.required = true;
    
    const label = document.createElement('label');
    label.htmlFor = `satisfaction_${i}`;
    label.textContent = i;
    
    container.appendChild(input);
    container.appendChild(label);
  }
}

function generateNPSScale() {
  const container = el('nps-group');
  container.innerHTML = '';
  
  for (let i = 0; i <= 10; i++) {
    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `nps_${i}`;
    input.name = 'recommandation_nps';
    input.value = i;
    input.required = true;
    
    const label = document.createElement('label');
    label.htmlFor = `nps_${i}`;
    label.textContent = i;
    
    container.appendChild(input);
    container.appendChild(label);
  }
}

function renderSpecificQuestions(activityType, phase) {
  const container = el('specific-questions');
  const section = el('specific-section');
  const label = el('specific-activity-label');
  
  const questions = QUESTIONS_MAP[activityType]?.[phase];
  
  if (!questions || questions.length === 0) {
    section.classList.add('hidden');
    return;
  }
  
  section.classList.remove('hidden');
  label.textContent = CONFIG.ACTIVITY_LABELS[activityType] + ' - ' + CONFIG.PHASE_LABELS[phase];
  container.innerHTML = '';
  
  questions.forEach(q => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'input-field';
    
    const questionLabel = document.createElement('label');
    questionLabel.textContent = q.question;
    if (q.required) {
      const star = document.createElement('span');
      star.className = 'required-star';
      star.textContent = ' *';
      questionLabel.appendChild(star);
    }
    questionDiv.appendChild(questionLabel);
    
    switch(q.type) {
      case 'scale_1_5':
        const scaleDiv = document.createElement('div');
        scaleDiv.className = 'option-group scale-1-5';
        for (let i = 1; i <= 5; i++) {
          const input = document.createElement('input');
          input.type = 'radio';
          input.id = `${q.id}_${i}`;
          input.name = q.id;
          input.value = i;
          input.required = q.required;
          
          const label = document.createElement('label');
          label.htmlFor = `${q.id}_${i}`;
          label.textContent = i;
          
          scaleDiv.appendChild(input);
          scaleDiv.appendChild(label);
        }
        questionDiv.appendChild(scaleDiv);
        break;
        
      case 'boolean':
        const boolDiv = document.createElement('div');
        boolDiv.className = 'option-group';
        
        ['Oui', 'Non'].forEach((text, idx) => {
          const input = document.createElement('input');
          input.type = 'radio';
          input.id = `${q.id}_${idx}`;
          input.name = q.id;
          input.value = idx === 0 ? 'true' : 'false';
          input.required = q.required;
          
          const label = document.createElement('label');
          label.htmlFor = `${q.id}_${idx}`;
          label.textContent = text;
          
          boolDiv.appendChild(input);
          boolDiv.appendChild(label);
        });
        questionDiv.appendChild(boolDiv);
        break;
        
      case 'select':
        const select = document.createElement('select');
        select.name = q.id;
        select.id = q.id;
        select.required = q.required;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = 'Choisir...';
        select.appendChild(defaultOption);
        
        q.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        });
        questionDiv.appendChild(select);
        break;
        
      case 'multiselect':
        const multiselectDiv = document.createElement('div');
        multiselectDiv.className = 'option-group';
        
        q.options.forEach((opt, idx) => {
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.id = `${q.id}_${idx}`;
          input.name = q.id;
          input.value = opt;
          
          const label = document.createElement('label');
          label.htmlFor = `${q.id}_${idx}`;
          label.textContent = opt;
          
          multiselectDiv.appendChild(input);
          multiselectDiv.appendChild(label);
        });
        questionDiv.appendChild(multiselectDiv);
        break;
        
      case 'number':
        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.name = q.id;
        numberInput.id = q.id;
        numberInput.required = q.required;
        numberInput.min = 0;
        questionDiv.appendChild(numberInput);
        break;
        
      default:
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.name = q.id;
        textInput.id = q.id;
        textInput.required = q.required;
        questionDiv.appendChild(textInput);
    }
    
    container.appendChild(questionDiv);
  });
}

// ====================================================================
// SAUVEGARDE DES RÉPONSES EN CSV - CORRIGÉ
// ====================================================================

async function saveResponseToCSV(formData) {
  if (!directoryHandle) {
    throw new Error('Aucun dossier projet sélectionné');
  }
  
  const activityType = formData.get('activity_type');
  const phase = formData.get('questionnaire_phase');
  
  // ✨ CORRIGÉ : Ajout des champs origine et niveau_etudes
  const row = {
    timestamp: new Date().toISOString(),
    participant_id: formData.get('participant_id'),
    session_id: formData.get('session_id') || '',
    age: formData.get('age'),
    genre: formData.get('genre'),
    origine: formData.get('origine'),                           // ✨ NOUVEAU
    statut_professionnel: formData.get('statut_professionnel'),
    niveau_etudes: formData.get('niveau_etudes'),               // ✨ NOUVEAU
    code_postal: formData.get('code_postal') || '',
    autonomie_percue: formData.get('autonomie_percue'),
    confiance_en_soi: formData.get('confiance_en_soi'),
    satisfaction_globale: formData.get('satisfaction_globale'),
    recommandation_nps: formData.get('recommandation_nps'),
    remarques_ouvertes: formData.get('remarques_ouvertes') || ''
  };
  
  // Ajouter les questions spécifiques
  const questions = QUESTIONS_MAP[activityType]?.[phase] || [];
  questions.forEach(q => {
    if (q.type === 'multiselect') {
      const values = formData.getAll(q.id);
      row[q.id] = values.join(';');
    } else {
      row[q.id] = formData.get(q.id) || '';
    }
  });
  
  if (IS_ELECTRON) {
    // Version Electron
    try {
      // Lire le fichier CSV existant
      const result = await window.electronAPI.readCSVFile(activityType, phase);
      let existingData = [];
      let headers = Object.keys(row);
      
      if (result.success && result.content) {
        const parsed = Papa.parse(result.content, { header: true, skipEmptyLines: true });
        existingData = parsed.data;
        
        if (parsed.meta.fields) {
          headers = [...new Set([...parsed.meta.fields, ...Object.keys(row)])];
        }
      }
      
      // Ajouter la nouvelle ligne
      existingData.push(row);
      
      // Convertir en CSV
      const csv = Papa.unparse(existingData, { 
        columns: headers,
        header: true 
      });
      
      // Écrire le fichier
      const writeResult = await window.electronAPI.writeCSVFile(activityType, phase, csv);
      
      if (writeResult.success) {
        showNotification('✅ Réponse enregistrée avec succès !', 'success');
        return true;
      } else {
        throw new Error(writeResult.error || 'Erreur d\'écriture');
      }
    } catch (e) {
      throw new Error(`Impossible de sauvegarder: ${e.message}`);
    }
  } else {
    // Version navigateur (code original)
    const activityDirName = `reponses_${activityType}`;
    let activityDir;
    
    try {
      activityDir = await directoryHandle.handle.getDirectoryHandle(activityDirName, { create: true });
    } catch (e) {
      throw new Error(`Impossible de créer le dossier ${activityDirName}: ${e.message}`);
    }
    
    const fileName = `${phase}.csv`;
    let existingData = [];
    let headers = Object.keys(row);
    
    try {
      const fileHandle = await activityDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      if (text.trim()) {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        existingData = parsed.data;
        
        if (parsed.meta.fields) {
          headers = [...new Set([...parsed.meta.fields, ...Object.keys(row)])];
        }
      }
    } catch (e) {
      // Fichier n'existe pas encore
    }
    
    existingData.push(row);
    
    const csv = Papa.unparse(existingData, { 
      columns: headers,
      header: true 
    });
    
    try {
      const fileHandle = await activityDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(csv);
      await writable.close();
      
      showNotification('✅ Réponse enregistrée avec succès !', 'success');
      return true;
    } catch (e) {
      throw new Error(`Impossible d'écrire dans le fichier: ${e.message}`);
    }
  }
}

// ====================================================================
// GESTION DU FORMULAIRE
// ====================================================================

function handleActivityChange(e) {
  currentActivity = e.target.value;
  if (currentPhase) {
    renderSpecificQuestions(currentActivity, currentPhase);
  }
}

function handlePhaseChange(e) {
  currentPhase = e.target.value;
  if (currentActivity) {
    renderSpecificQuestions(currentActivity, currentPhase);
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!directoryHandle) {
    showNotification('❌ Veuillez d\'abord sélectionner un dossier projet', 'error');
    return;
  }
  
  const form = e.target;
  const formData = new FormData(form);
  
  try {
    await saveResponseToCSV(formData);
    
    // Réinitialiser le formulaire
    form.reset();
    el('specific-section').classList.add('hidden');
    currentActivity = null;
    currentPhase = null;
    
    // Remonter en haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showNotification(`❌ Erreur: ${error.message}`, 'error');
  }
}

// ====================================================================
// INITIALISATION
// ====================================================================

async function init() {
  if (IS_ELECTRON) {
    console.log('Application en mode Electron');
  } else if (!window.showDirectoryPicker) {
    showNotification('⚠️ Votre navigateur ne supporte pas l\'API File System Access. Utilisez Chrome/Edge récent ou la version Electron.', 'error');
    el('submit-form').disabled = true;
    return;
  }
  
  // Charger le dossier sauvegardé
  await loadSavedDirectory();
  
  // Peupler les sélecteurs
  populateActivitySelector();
  populatePhaseSelector();
  generateSatisfactionScale();
  generateNPSScale();
  
  // Événements
  el('activity-type').addEventListener('change', handleActivityChange);
  el('questionnaire-phase').addEventListener('change', handlePhaseChange);
  el('questionnaire-form').addEventListener('submit', handleFormSubmit);
}

// Bouton de sélection du dossier
el('select-folder-btn').addEventListener('click', async () => {
  if (IS_ELECTRON) {
    try {
      const result = await window.electronAPI.selectDirectory();
      
      if (result.success) {
        directoryHandle = result;
        updateFolderDisplay(true, result.name);
        showNotification(`✅ Dossier "${result.name}" sélectionné`, 'success');
      }
    } catch(e) {
      showNotification('❌ Erreur lors de la sélection', 'error');
    }
  } else {
    if (!window.showDirectoryPicker) {
      showNotification('❌ API non supportée', 'error');
      return;
    }
    
    try {
      const handle = await window.showDirectoryPicker();
      directoryHandle = { name: handle.name, handle: handle };
      window._projectDirectory = handle;
      updateFolderDisplay(true, handle.name);
      showNotification(`✅ Dossier "${handle.name}" sélectionné`, 'success');
    } catch(e) {
      if (e.name !== 'AbortError') {
        showNotification('❌ Erreur lors de la sélection', 'error');
      }
    }
  }
});

// Bouton retour au dashboard
const backBtn = document.createElement('button');
backBtn.className = 'btn secondary';
backBtn.textContent = '← Retour au Dashboard';
backBtn.style.position = 'fixed';
backBtn.style.top = '20px';
backBtn.style.left = '20px';
backBtn.style.zIndex = '1000';
backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});
document.body.appendChild(backBtn);

window.addEventListener('load', init);