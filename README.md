# Dashboard Impact Multi-Activités - Version Electron

Application de bureau pour la gestion et l'analyse de questionnaires d'impact associatif.

## 📋 Structure du Projet

```
dashboard-impact/
├── main.js              # Processus principal Electron
├── preload.js           # Bridge sécurisé
├── package.json         # Configuration npm
└── src/                 # Fichiers source
    ├── index.html       # Page principale (dashboard)
    ├── dashboard.js     # Logique dashboard
    ├── questionnaire.html
    ├── questionnaire.js
    ├── config.js        # Configuration
    ├── styles.css       # Styles CSS
    └── icon.png         # Icône de l'application
```

## 🚀 Installation

### Prérequis
- **Node.js** (version 16 ou supérieure)
- **npm** (installé avec Node.js)

### Étapes d'installation

1. **Télécharger et extraire le projet**
   ```bash
   cd chemin/vers/dashboard-impact
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer l'application**
   ```bash
   npm start
   ```

## 🔨 Compilation de l'application

Pour créer un exécutable standalone :

```bash
npm run build
```

L'exécutable sera dans le dossier `dist/`.

### Plateformes supportées
- **Windows** : `.exe` (installateur NSIS)
- **macOS** : `.dmg`
- **Linux** : `.AppImage`

## 📁 Utilisation des Dossiers Externes

### Première utilisation

1. **Lancer l'application**
2. **Cliquer sur "📁 Choisir dossier projet"**
3. **Sélectionner un dossier vide** sur votre ordinateur (ex: `Documents/Projets-Impact/`)

### Structure des données

L'application créera automatiquement cette structure dans votre dossier :

```
Mon-Projet-Impact/
└── data/
    ├── reponses_inclusion_numerique/
    │   ├── avant.csv
    │   ├── apres.csv
    │   ├── suivi_3mois.csv
    │   └── suivi_6mois.csv
    ├── reponses_secourisme/
    │   └── ...
    ├── reponses_accompagnement_social/
    │   └── ...
    └── reponses_formation_citoyenne/
        └── ...
```

### Avantages
✅ **Vos données restent sur votre ordinateur**  
✅ **Sauvegarde facile** (copiez le dossier)  
✅ **Partage possible** (via clé USB, cloud, etc.)  
✅ **Pas de limitation de taille**

## 🎯 Fonctionnalités

### Dashboard
- 📊 Visualisation des données
- 📈 Graphiques interactifs
- 🔍 Filtres et recherche
- 📥 Export de rapports

### Questionnaire
- 📝 Saisie de réponses
- ✅ Validation des champs
- 💾 Enregistrement automatique dans le dossier projet
- 🔄 Support multi-activités et multi-phases

## ⚙️ Configuration

Les activités et phases sont définies dans `src/config.js` :

- **Inclusion Numérique**
- **Secourisme / ASB**
- **Accompagnement Social**
- **Formation Citoyenne**

Phases :
- Avant (Diagnostic)
- Après (Évaluation immédiate)
- Suivi à 3 mois
- Suivi à 6 mois

## 🐛 Résolution de problèmes

### L'application ne démarre pas
```bash
# Réinstaller les dépendances
rm -rf node_modules
npm install
npm start
```

### Erreur "Dossier non accessible"
- Vérifiez que vous avez les droits d'accès au dossier
- Essayez de sélectionner un autre dossier

### Les données ne se sauvegardent pas
- Vérifiez que le dossier projet est bien sélectionné
- Regardez dans le dossier si `data/` a été créé
- Consultez la console développeur (Ctrl+Shift+I)

## 📞 Support

Pour toute question ou problème :
1. Vérifiez ce README
2. Consultez les logs dans la console (F12)
3. Contactez le support technique

## 📝 Notes Techniques

- **Framework** : Electron 28.0.0
- **Stockage** : CSV via système de fichiers local
- **Graphiques** : Chart.js 3.9.1
- **Parsing CSV** : PapaParse 5.4.1

## 🔒 Sécurité

- ✅ Isolation de contexte activée
- ✅ Pas d'accès Node.js direct depuis le rendu
- ✅ Communication sécurisée via IPC
- ✅ Données stockées localement uniquement