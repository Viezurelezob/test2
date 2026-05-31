# Test plan

## Functional

- New Game pornește Overgrown Approach; Continue este dezactivat fără salvare și activ după checkpoint/manual save.
- Verifică mers, sprint, salt, double jump, wall jump și cădere cu respawn.
- Verifică melee, ranged, cooldown, damage, invulnerability frames, knockback și moartea inamicului.
- Colectează monede, cristal și cheie; verifică HUD și efectul de particule.
- Activează checkpoint, reîncarcă pagina și continuă din checkpoint.
- Deschide Pause, Inventory și Settings; modifică volumele și debug overlay.

## Bug checklist

- Fără tunneling vizibil prin platforme la viteza curentă.
- Fără input blocat după pause/resume sau schimbare de scenă.
- Fără excepții dacă fișierele audio nu există.
- Fără proiectile sau particule active permanent după expirare.
- Payload LocalStorage invalid este ignorat.

## Performance checklist

- Rulează profilare la 60 FPS în viewport 1280×720.
- Verifică pool-urile pentru proiectile, pickups și particule fără alocări per-frame.
- Verifică plafonarea acumulatorului după revenirea din tab inactiv.
- Verifică overlay-ul F3: entități, particule și tile-uri active.

## Gameplay checklist

- Checkpoint-ul este vizibil și oferă feedback.
- Telegraph-ul portocaliu al inamicului precede atacul.
- Fundalul parallax și vremea nu reduc lizibilitatea platformelor.
- HUD-ul oferă HP, energie, XP, nivel, aur, cristale și chei.

## Verificări automate React

- `npm test` verifică navigarea meniurilor, disponibilitatea Continue, volumele Music/SFX, debug toggle, snapshot-ul inventarului și expirarea toast-urilor.
- `npm run build` verifică bundle-ul Vite de producție.

## Smoke test manual după migrarea React

- Pornește un New Game și confirmă randarea scenei pe canvas.
- Creează o salvare, reîncarcă aplicația și folosește Continue.
- Apasă `Esc`, verifică pauza, Manual Save și întoarcerea în Main Menu.
- Deschide Inventory și confirmă valorile curente.
- Lasă player-ul să moară și confirmă respawn-ul la checkpoint sau spawn.
