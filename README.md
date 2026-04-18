# Penguin Push

Penguin Push is a web-based touch-friendly game prototype built with HTML, CSS, and JavaScript canvas rendering.

The current build focuses on a clean, responsive foundation:

- A soft blue gradient background
- A randomly shaped ice floe rendered in canvas
- Four penguins placed on stable cardinal spawn points
- A draggable joystick for desktop and mobile
- A direction indicator that shows where the player is aiming
- A strength slider and Push button for shot-based movement
- Shared penguin physics with collisions and push interactions
- Round-based floe shrinking with win/lose overlays

## Controls

- Desktop: drag the joystick in the bottom-left corner
- Mobile: drag the joystick in the bottom-center area
- The arrow around the player penguin stays on screen after you release the joystick
- Adjust strength with the slider, then press Push to send the penguin sliding

## Project Structure

- [index.html](index.html) - page shell and canvas mount point
- [styles.css](styles.css) - background, layout, and joystick styling
- [main.js](main.js) - game bootstrap, UI wiring, and round orchestration
- [canvas.js](canvas.js) - canvas resize handling
- [floe.js](floe.js) - ice floe generation, geometry helpers, and sizing utilities
- [joystick.js](joystick.js) - touch and pointer joystick input
- [directionArrow.js](directionArrow.js) - direction arrow rendering
- [aiPenguin1.js](aiPenguin1.js) - AI 1 targeting script (player focus)
- [aiPenguin2.js](aiPenguin2.js) - AI 2 targeting script (nearest penguin)
- [aiPenguin3.js](aiPenguin3.js) - AI 3 targeting script (randomized center bias)
- [ai/shotPlanner.js](ai/shotPlanner.js) - shared AI shot orchestration
- [penguins/state.js](penguins/state.js) - penguin roster and state creation
- [penguins/render.js](penguins/render.js) - penguin and splash rendering helpers
- [penguins/physics.js](penguins/physics.js) - collisions, sliding, and fall detection

## Current Status

The prototype now includes a full playable loop with simultaneous turns, simple AI shot logic, shared push physics, floe shrink rounds, and win/lose states.

## Repository

GitHub: https://github.com/Niklas-1999/Penguin_Push