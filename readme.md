# 📊 Tableau de Bord de Productivité Interactif

>Ce projet est une Single Page Application (SPA) interactive conçue pour transformer une liste de tâches statique (Markdown) en un outil de pilotage dynamique. Il permet de visualiser la répartition de l'effort, de suivre la progression en temps réel et de réduire la fatigue décisionnelle grâce à un mode "Focus".

## 🚀 Fonctionnalités Clés

- Focus Mode : Isole automatiquement la tâche prioritaire non accomplie pour une exécution immédiate.

- Gestion d'État Dynamique : Les statistiques (Total, Restant) et la liste de tâches se mettent à jour instantanément sans rechargement de page.

- Visualisations de Données :

- Graphique Donut : Répartition entre les tâches urgentes (Priorités) et le travail de fond.

- Graphique à barres empilées : Suivi visuel de la progression (Fait vs À faire).

- Système de Filtrage : Vue globale ou segmentée par catégorie (🔥 Priorités / 📅 Projets).

- Design Adaptatif (Responsive) : Interface optimisée pour Desktop, Tablette et Mobile via Tailwind CSS.

## 🛠️ Stack Technique

- Frontend : HTML5 / CSS3 (Tailwind CSS via CDN).

- Logique : Vanilla JavaScript (ES6+).

- Graphiques : Chart.js pour les visualisations interactives sur Canvas.

- Typographie : Inter (Google Fonts).

## 📂 Structure du Fichier

>L'application est entièrement contenue dans le fichier index.html.
```js
// Structure simplifiée des données (tasksData)
{ 
    id: 1, 
    title: "Titre de la tâche", 
    category: "priority | work", 
    project: "Nom du Projet",
    isCompleted: false 
}

```
## ⚙️ Installation et Déploiement

1. Local : Clonez le dépôt et ouvrez simplement index.html dans votre navigateur préféré.
2. GitHub Pages :
3. Poussez le code sur votre dépôt GitHub.
4. Allez dans Settings > Pages.
5. Sélectionnez la branche main et enregistrez.
6. L'application sera accessible publiquement via l'URL fournie par GitHub.

## 📝 Personnalisation

>Pour mettre à jour les tâches, il suffit de modifier la constante __tasksData__ dans la balise : 

 ```js
 <script> 
    /* du fichier index.html. 
    L'interface et les graphiques 
    s'adapteront automatiquement aux 
    nouvelles données lors du prochain chargement. 
    */
</script>
 ```

>Projet généré et optimisé pour une productivité maximale.