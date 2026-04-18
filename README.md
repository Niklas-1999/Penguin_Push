# Penguin Push

Penguin Push is a web-based touch-friendly game prototype built with HTML, CSS, and JavaScript canvas rendering.

The current build focuses on a clean, responsive foundation:

- A soft blue gradient background
- A randomly shaped ice floe rendered in canvas
- Four penguins placed on stable cardinal spawn points
- A draggable joystick for desktop and mobile
- A direction indicator that shows where the player is aiming
- A strength slider and Push button for shot-based movement

## Controls

- Desktop: drag the joystick in the bottom-left corner
- Mobile: drag the joystick in the bottom-center area
- The arrow around the player penguin stays on screen after you release the joystick
- Adjust strength with the slider, then press Push to send the penguin sliding

## Project Structure

- [index.html](index.html) - page shell and canvas mount point
- [styles.css](styles.css) - background, layout, and joystick styling
- [main.js](main.js) - game bootstrap and render loop
- [canvas.js](canvas.js) - canvas resize handling
- [floe.js](floe.js) - ice floe generation and geometry helpers
- [joystick.js](joystick.js) - touch and pointer joystick input
- [directionArrow.js](directionArrow.js) - direction arrow rendering
- [playerPenguin.js](playerPenguin.js) - player penguin drawing
- [aiPenguin1.js](aiPenguin1.js) - AI penguin drawing
- [aiPenguin2.js](aiPenguin2.js) - AI penguin drawing
- [aiPenguin3.js](aiPenguin3.js) - AI penguin drawing

## Current Status

This is an early prototype. The foundation is in place for movement, AI behavior, scoring, and UI overlays.

## Repository

GitHub: https://github.com/Niklas-1999/Penguin_Push