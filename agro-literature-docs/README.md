# Base documentaire agronomique

Déposez ici les PDF de référence (physiologie tomate, conduite climatique, fertirrigation sous
serre chauffée) que vous avez obtenus légalement (bibliothèque, abonnement).

Ce dossier n'est **pas exposé sur le dashboard** - aucune page de l'app ne permet d'uploader ou de
lister ces fichiers. C'est un dossier local que vous alimentez directement, puis vous lancez
l'ingestion en local :

```
npm run ingest:agro-literature
```

Ce que fait la commande, pour chaque PDF présent dans ce dossier :
1. Ignore les fichiers déjà ingérés (même nom déjà présent dans `agro_literature_docs`).
2. Stocke le PDF dans le bucket Supabase privé `agro-literature`.
3. Extrait le texte (Gemini), le découpe en chunks, calcule un embedding par chunk et les
   enregistre dans `agro_literature_chunks` (recherchable par l'agent via `match_agro_literature`).

Les PDF ne sont jamais commités dans git (voir `.gitignore`) - seul ce README l'est.
