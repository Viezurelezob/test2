# Aetherbound — Game Design Document

## Viziune și setting

Aetherbound este un action-platformer 2D original despre un călător care recuperează relicve din teritorii suspendate de curenți de energie. Bucla principală este: explorare, platforming, luptă, colectare, activare checkpoint, upgrade și confruntare cu boss-ul biomului. Vertical slice-ul implementează prima zonă din Verdant Hollows.

## Biome și boss fights

| Biom | Identitate | Boss | Temă de confruntare |
| --- | --- | --- | --- |
| Verdant Hollows | câmpii și ruine vegetale | Thornback Warden | controlul spațiului prin spini |
| Echoing Grotto | peșteri cristaline | Resonant Maw | unde de șoc ritmice |
| Frostveil Spires | creste înghețate | The Pale Gale | mobilitate și rafale |
| Emberroot Furnace | adâncuri vulcanice | Cinderheart Colossus | căldură și platforme temporare |
| Aetherglass Citadel | insule aeriene | Stormbound Regent | curenți verticali și fulgere |

Fiecare biom are două niveluri de explorare și o arenă de boss declarate în `src/data/levels.js`. Fazele boss-ilor se schimbă la pragurile de 66% și 33% HP.

## Inamici, collectibles și progresie

Inamicii standard folosesc patrol, chase și attack, cu telegraph înainte de damage. Monedele cumpără upgrade-uri; cristalele contribuie la progresie; cheile și relicvele deblochează zone; power-up-urile oferă efecte temporare. Skill tree-ul are ramuri de mobilitate, luptă și supraviețuire. Dificultatea crește prin distanțe mai mari, hazard-uri mai dense și combinații de inamici, nu prin salturi arbitrare de HP.

## Balansare inițială

Player-ul pornește cu 100 HP, 100 energie, mers la 210 px/s, sprint la 350 px/s și double jump disponibil în vertical slice. Mossling are 45 HP, atac de 12 damage și o rază de detecție de 340 px. Valorile sunt centralizate în date și constante pentru iterații rapide.

## Monetizare etică

- Achiziție premium unică pentru jocul complet.
- Soundtrack original opțional.
- Expansion pack-uri substanțiale cu biome noi.
- Cosmetic packs originale, exclusiv vizuale.
- Fără pay-to-win, reclame intruzive, loot boxes sau mecanici predatoare.
