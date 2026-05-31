# Arhitectură

## Module și flux de date

`src/main.jsx` montează aplicația React, iar `src/hooks/useGameRuntime.js` compune serviciile mici: input, event bus, scene manager, loop, audio și save. Componentele React din `src/components/` orchestrează exclusiv interfața: meniuri, setări, inventar și toast-uri. Ele expun acțiuni declarative către runtime și nu desenează jocul în DOM.

`PlayScene` deține starea runtime a vertical slice-ului și orchestrează update-ul: player → AI → proiectile → pickups → particule → checkpoint → cameră. Scenele jocului rămân randate procedural pe suprafața Canvas. Rendering-ul citește starea după fiecare update fix. Datele de biome, niveluri, obiecte, inamici și skill-uri rămân declarative în `src/data/`.

## Game loop și scene

`Game` folosește `requestAnimationFrame`, acumulator, update fix la 60 Hz și render separat cu alpha disponibil pentru interpolare. Delta acumulată este plafonată la 0.25 secunde pentru evitarea spiral-of-death. Când jocul este în pauză, simularea nu avansează și acumulatorul se resetează. `SceneManager` aplică tranzițiile înaintea următorului update sigur. La demontarea React, hook-ul oprește frame-ul programat, elimină listener-ele de input și subscription-urile event bus și închide scena activă, astfel încât montarea dublă din React Strict Mode să nu pornească runtime-uri concurente.

## ECS

`src/ecs/` oferă un strat ECS minimal reutilizabil: entități cu componente mapate, query-uri și sisteme. Vertical slice-ul folosește obiecte gameplay specializate pentru lizibilitate, dar sistemele viitoare pot migra incremental spre ECS.

## Enemy FSM

FSM-ul reutilizabil are stările `idle`, `patrol`, `chase`, `attack`, `hurt`, `dead`:

- `idle → patrol` după timer; `idle → chase` dacă player-ul intră în detection radius.
- `patrol → idle` la expirarea segmentului sau depășirea razei waypoint-ului; direcția este inversată.
- `chase → attack` când player-ul intră în attack range; `chase → patrol` după aggro timeout.
- `attack → chase` după telegraph și atac; cooldown-ul previne damage continuu.
- Orice stare vie poate trece în `hurt`; HP zero trece în `dead`.

Line-of-sight-ul simplificat folosește distanța orizontală. Patrularea este limitată în jurul waypoint-ului de origine; coliziunea cu ziduri oprește mișcarea. Extensia de platform-edge probe poate inversa direcția înaintea unei margini. `BossFSM` urmărește fazele 1, 2 și 3 la pragurile HP >66%, >33% și ≤33%.

## Save system

Payload-ul LocalStorage este versionat. Include nivel, checkpoint, stats, skill-uri, inventar, echipament, collectibles, unlock-uri și setări. `Storage` validează minim payload-ul și refuză versiuni necunoscute mai noi. `SaveManager` auto-salvează la checkpoint și level complete și expune manual save pentru pause menu. Migrările viitoare se adaugă incremental în `Storage.migrate`.

## Asset pipeline

`AssetLoader.loadBiome()` este lazy și tolerant la lipsa asset-urilor. În prezent randarea este procedurală și audio lipsește intenționat; managerii audio ignoră silențios fișierele indisponibile. Asset-uri originale pot fi adăugate ulterior în manifestul fiecărui biom.
