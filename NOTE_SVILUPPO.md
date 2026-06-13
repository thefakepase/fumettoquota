# 📌 Nota di sviluppo — Grand Line Odyssey (riprendere da qui)

> Promemoria per riprendere il lavoro col gioco. Quando l'utente torna, si continua da **"Prossimi passi"**.

## Dov'è il gioco
- File unico: `public/grand-line-survivors.html` (gioco Three.js ispirato a One Piece)
- Branch di sviluppo: `claude/onepiece-roguelite-threejs-vgjok0`
- Online (GitHub Pages): https://thefakepase.github.io/fumettoquota/ (si aggiorna dai push su `main`)

## Stato attuale (fatto)
- **Solo modalità Avventura** (la modalità roguelite "Sopravvivenza" è stata rimossa).
- Mare aperto navigabile con la nave → sbarco su **6 isole a tema** → esplori, apri forzieri (berry), combatti la Marina e sconfiggi il **Boss** per liberare l'isola.
- **6 personaggi** giocabili (alcuni da sbloccare con i berry); combattimento auto + scatto + special.
- Grafica: bloom, ciclo **giorno/notte** (stelle/luna), **SSAO + color grading + FXAA**, preset qualità **Ultra/Alto/Lite** (pulsante in basso a sx), modelli procedurali toon.
- Mobile: joystick virtuale + pulsanti touch (scatto, special, azione ✋, pausa).

## Prossimi passi (DA FARE quando l'utente torna)
1. **Look anime con modelli 3D veri.** L'utente fornirà **lui** i modelli (`.glb`/`.gltf` o `.vrm`) creati con **VRoid Studio** / **Mixamo** / **Sketchfab (CC)**.
   - Da costruire: un **caricatore** nel gioco → mettere il file in `public/assets/characters/` e usarlo al posto del modello procedurale, con **ripiego** automatico se manca.
   - Serve **un file di esempio** dall'utente per integrare/testare bene (scala, rig, nomi delle animazioni variano da modello a modello).
2. **Bug**: l'utente dice "super bugato" → farsi dire i **sintomi precisi** (nave/sbarco/nemici/crash?) prima di correggere.
3. In alternativa/aggiunta ai modelli: passaggio a **cel-shading** anime (ombre a fasce, contorni, rim light).

## Vincoli importanti da ricordare
- ⚠️ **Copyright**: niente modelli ufficiali/rippati di personaggi One Piece in un **repo pubblico** (= distribuzione). Per uso davvero privato: tenere i modelli **solo in locale** oppure rendere il **repo privato**.
- 🔌 Questo ambiente **non può scaricare** asset da internet (passa solo `npm`; i CDN sono bloccati). Three.js e i moduli di post-processing sono **incorporati** dal pacchetto npm.
- 🧪 Test con Playwright headless: gira a ~6 fps col bloom (è un limite del test software, **non** un bug del gioco).

## In sospeso (tecnico)
- Il push su `main` dava un errore di rete del server git (`send-pack: unexpected disconnect`). Il **branch è aggiornato**; ritentare il push su `main` per rinfrescare la versione online.
