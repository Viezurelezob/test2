# Aetherbound

**Aetherbound** este un vertical slice original de action-platformer 2D. React orchestrează meniurile și controalele UI, iar Canvas desenează toate formele, fundalurile, personajele și efectele procedural, fără asset-uri externe.

## Rulare locală

Instalează dependențele și pornește serverul Vite din rădăcina proiectului:

```bash
npm install
npm run dev
```

Vite afișează URL-ul local care trebuie deschis într-un browser modern. Pentru verificarea bundle-ului de producție:

```bash
npm run build
```

Build-ul poate fi previzualizat local cu `npm run preview`.

## Controale

| Acțiune | Tastatură |
| --- | --- |
| Mișcare | `A` / `D` sau săgeți |
| Sprint | `Shift` |
| Salt, double jump, wall jump | `Space` |
| Atac melee | `J` |
| Atac ranged | `K` |
| Pauză | `Escape` |
| Debug overlay | `F3` |

## Vertical slice

Primul nivel, **Overgrown Approach** din biomul **Verdant Hollows**, include parallax, vreme, platforme, checkpoint, respawn, collectibles, inamici cu patrol/chase/attack, proiectile reutilizabile, particule reutilizabile, HUD, meniu, pauză, setări și salvare LocalStorage.

## Structură

- `src/components/`, `src/hooks/`: componentele React și integrarea declarativă cu runtime-ul jocului.
- `src/core/`: game loop, scene, input, events și asset loading lazy.
- `src/physics/`: integrare, constante și coliziuni AABB separate pe axe.
- `src/gameplay/`: player, luptă, inamici, obiecte, inventar, skill tree și checkpoints.
- `src/rendering/`: cameră, renderer, parallax, vreme și particule.
- `src/save/`, `src/audio/`, `src/ui/`, `src/data/`: servicii, HUD-ul procedural și conținut declarativ.
- `docs/`: design, arhitectură, fizică, test plan și roadmap.
