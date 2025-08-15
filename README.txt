Agency

This is the central README for the 'Agency' terminal PWA. It serves as a comprehensive guide to the project, detailing its structure, features, and how to get it running.

## Project Overview

'Agency' is a sophisticated, terminal-based Progressive Web App (PWA) designed to simulate a tactical command console. The game is built using a core set of modern web technologies: HTML, CSS, and vanilla JavaScript. It is architecturally designed to be modular and scalable, with a strong focus on high-fidelity UI/UX, robust game logic, and PWA capabilities.

## Key Features

* **Secure Login Simulation:** A dynamic, animated login screen with a simulated password authentication sequence.
* **Modular UI:** A multi-pane dashboard with dedicated sections for:
    * **Map:** A simulated map using the Leaflet.js library.
    * **Tasks:** A mission log with a procedural generation system.
    * **Mail:** An inbox for in-game messages.
    * **Contacts:** A list of in-game contacts and their statuses.
    * **Database:** A data pane for player intelligence and records.
    * **Armory:** A pane to manage and deploy assets.
    * **Tools:** A sandbox for special abilities with cooldowns.
    * **A.N.N.A.:** An AI assistant with a simple chat interface.
* **Persistent Game State:** All game data is stored in the browser's `localStorage` to ensure progress is saved between sessions.
* **Procedural Content Generation:** The game engine includes a mission generation algorithm that creates unique, dynamic tasks for the player.
* **PWA Capabilities:** The application can be installed on a desktop or mobile device and works offline thanks to a Service Worker.
* **Responsive Design:** The UI is fully responsive, providing an optimal experience on both desktop and mobile screens.

## File Structure

The project is organized into a clean and logical directory structure:

