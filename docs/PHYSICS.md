# Fizică

## Integrare și constante

Simularea rulează determinist la `dt = 1 / 60`. Mișcarea orizontală aplică accelerație și momentum:

```text
v = clamp(v + a * dt, -vMax, vMax)
p = p + v * dt
```

Când input-ul orizontal lipsește, viteza este redusă spre zero cu friction: `vx = approach(vx, 0, friction * dt)`. Sprint-ul modifică `vMax`, nu accelerația. Gravitația este:

```text
vy = min(vy + g * dt, terminalVelocity)
```

Valorile inițiale sunt: gravitație `1900 px/s²`, terminal velocity `920 px/s`, accelerație `1700 px/s²`, friction `2100 px/s²`, salt `620 px/s` și impuls wall jump orizontal `400 px/s`.

## Salturi

Un salt de la sol setează `vy` negativ. În aer este permis încă un impuls pentru double jump. La contact lateral, wall jump aplică impuls vertical și un impuls orizontal opus zidului. Starea grounded se recalculează la fiecare pas Y.

## AABB și rezolvare

Pentru două AABB `a` și `b`, există overlap dacă intervalele lor se intersectează pe ambele axe. Adâncimea este:

```text
overlapX = min(a.right - b.left, b.right - a.left)
overlapY = min(a.bottom - b.top, b.bottom - a.top)
```

Mișcarea este rezolvată separat: se aplică `x += vx * dt`, se corectează penetrarea X relevantă și se anulează `vx`; apoi se aplică `y += vy * dt`, se corectează penetrarea Y relevantă și se anulează `vy`. Separarea axelor este echivalentul practic al alegerii axei relevante de penetrare pentru platformer și păstrează grounded stabil.
