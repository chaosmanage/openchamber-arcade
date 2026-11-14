# Arcade

Four small games in one OpenChamber Work Status section: Snake, Flappy Bird, 2048 and Dino Run.

Expand **Arcade** in Work Status to get a 2×2 launcher. Pick a game and it takes over the
full section width; **Games** brings the launcher back. Best scores are kept in extension
storage (`arcade:best`), so they survive collapses and reloads. The section is collapsed by
default and asks for no capabilities, service or network access.

## Install

Add the repository in **Settings → Extensions**, or open the install link:

```text
https://github.com/chaosmanage/openchamber-arcade
```

The repository is private for now, so OpenChamber fetches it with your Git account (HTTPS)
or over SSH. The built `status/main.js` is committed, so installing never runs a build.

## Build

```sh
bun add @openchamber/sdk@2.7.0
bunx openchamber-guest-bundle status/main.ts status/main.js
bunx openchamber-guest-check
```

## Layout

```
status/
├── index.html          guest page
├── style.css           theme-token styling for the launcher and stage
├── main.ts             host connection, launcher, score and overlay handling
├── previews.ts         launcher artwork
└── games/
    ├── types.ts        Game and GameDefinition contracts
    ├── canvas.ts       themed canvas, palette cache and rAF loop
    ├── index.ts        game catalog
    ├── snake.ts
    ├── flappy.ts
    ├── game2048.ts
    └── dino.ts
```

## Demo

<img align="center" width="90%" alt="openchamber-arcade" src="https://github.com/user-attachments/assets/468e4769-5d10-41b1-b60e-59577925f13b" />

