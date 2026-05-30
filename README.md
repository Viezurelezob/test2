# Aetherbound

**Aetherbound** este un vertical slice original de action-platformer 2D, construit fără framework-uri și fără asset-uri externe: Canvas desenează toate formele, fundalurile, personajele și efectele procedural.

## Rulare locală

Modulele ES necesită un server static local. Din rădăcina proiectului:

```bash
python3 -m http.server 4173
```

Apoi deschide `http://localhost:4173` într-un browser modern.

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

- `src/core/`: game loop, scene, input, events și asset loading lazy.
- `src/physics/`: integrare, constante și coliziuni AABB separate pe axe.
- `src/gameplay/`: player, luptă, inamici, obiecte, inventar, skill tree și checkpoints.
- `src/rendering/`: cameră, renderer, parallax, vreme și particule.
- `src/save/`, `src/audio/`, `src/ui/`, `src/data/`: servicii și conținut declarativ.
- `docs/`: design, arhitectură, fizică, test plan și roadmap.
