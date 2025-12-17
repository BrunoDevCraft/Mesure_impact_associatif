\# Mesure d'Impact Associatif



Ce répertoire a pour but de mettre à disposition un programme de mesure d'impact de diverses activités au sein d'une petite association. Il est non exhaustif et modifiable.



\## Description



\*\*Dashboard Impact Multi-Activités\*\* est une application de bureau développée avec Electron, conçue pour mesurer et visualiser l'impact des activités associatives via des questionnaires pré et post-activité. L'application permet de :



\- Sélectionner un dossier projet contenant les données.

\- Lire et écrire des fichiers CSV pour différentes activités et phases (ex. : pré, post).

\- Afficher un dashboard avec des KPIs, graphiques et analyses.

\- Exporter les rapports au format PDF.



Le projet utilise des données fictives dans le répertoire `data/` pour les tests et démonstrations.



\## Fonctionnalités Principales



\- \*\*Gestion de Projets\*\* : Sélection et gestion d'un dossier projet pour stocker les données.

\- \*\*Traitement des Données\*\* : Lecture/écriture de fichiers CSV organisés par activité (ex. : `reponses\_<activité>/<phase>.csv`).

\- \*\*Dashboard Interactif\*\* : Visualisation des indicateurs clés, graphiques comparatifs (pré/post), démographiques et remarques.

\- \*\*Export PDF\*\* : Génération de rapports PDF optimisés avec styles d'impression personnalisés.

\- \*\*Support Multi-Plateformes\*\* : Builds pour Windows, macOS et Linux.



\## Technologies Utilisées



\- \*\*Langages\*\* : JavaScript (68,6 %), HTML (16,8 %), CSS (14,6 %).

\- \*\*Framework\*\* : Electron pour l'application de bureau.

\- \*\*Dépendances\*\* : Electron, Electron-Builder.

\- \*\*Autres\*\* : Utilisation de Chart.js (probablement pour les graphiques, basé sur le code).



\## Structure du Répertoire



\- \*\*`data/`\*\* : Contient des données fictives pour les tests (ex. : fichiers CSV pour différentes activités).

\- \*\*`src/`\*\* : Code source de l'application, incluant `index.html` (interface principale), scripts JavaScript pour le dashboard, styles CSS et icônes.

\- \*\*`main.js`\*\* : Processus principal Electron (gestion de la fenêtre, IPC, export PDF).

\- \*\*`preload.js`\*\* : Bridge sécurisé entre le processus principal et le renderer.

\- \*\*`package.json`\*\* : Configuration du projet, scripts et build.



\## Installation



\### Pour les Utilisateurs (Version Précompilée)



\- Téléchargez la dernière release pour votre plateforme depuis la \[page des releases](https://github.com/BrunoDevCraft/Mesure\_impact\_associatif/releases).

&nbsp; - Exemple : `Windows\_version\_mesure\_impact\_associatif` pour Windows.



\- Exécutez l'installateur ou l'exécutable directement.



\### Pour les Développeurs



1\. Clonez le répertoire :

&nbsp;  ```

&nbsp;  git clone https://github.com/BrunoDevCraft/Mesure\_impact\_associatif.git

&nbsp;  ```



2\. Installez les dépendances :

&nbsp;  ```

&nbsp;  npm install

&nbsp;  ```



3\. Lancez l'application en mode développement :

&nbsp;  ```

&nbsp;  npm start

&nbsp;  ```



4\. Pour build une version distributable :

&nbsp;  ```

&nbsp;  npm run build

&nbsp;  ```

&nbsp;  Les fichiers de build seront générés dans le répertoire `dist/`.



\## Utilisation



1\. Lancez l'application.

2\. Sélectionnez un dossier projet (ou créez-en un nouveau).

3\. Dans le dashboard :

&nbsp;  - Chargez les données CSV pour les activités.

&nbsp;  - Visualisez les analyses (KPIs, graphiques pré/post, démographiques).

&nbsp;  - Exportez le rapport en PDF via le bouton dédié.



Pour des données réelles, placez vos fichiers CSV dans `data/reponses\_<nom\_activite>/<phase>.csv` (ex. : `pre.csv`, `post.csv`).



\*\*Note\*\* : L'application est conçue pour des petites associations ; adaptez les questionnaires et analyses selon vos besoins.



\## Contribution



Les contributions sont bienvenues ! Pour contribuer :



1\. Forkez le répertoire.

2\. Créez une branche pour votre feature (`git checkout -b feature/nouvelle-fonction`).

3\. Committez vos changements (`git commit -m 'Ajout de nouvelle fonction'`).

4\. Poussez la branche (`git push origin feature/nouvelle-fonction`).

5\. Ouvrez une Pull Request.



Veuillez respecter les conventions de code et ajouter des tests si possible.



\## Licence



Ce projet est sous licence MIT. Voir le fichier `package.json` pour plus de détails (ou ajoutez un fichier `LICENSE` si nécessaire).



\## Contact



Auteur : BrunoDevCraft  

GitHub : \[BrunoDevCraft](https://github.com/BrunoDevCraft)  



Pour toute question ou suggestion, ouvrez une issue sur le répertoire.

