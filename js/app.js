/*
  Agency - Core Game Logic (app.js)
  
  This file serves as the main game engine for the "Agency" terminal simulator.
  It manages all game state, UI interactions, procedural generation, AI functions,
  and resource management.
*/

// ====================
// CORE STATE MANAGEMENT
// ====================

// The central object to store all game data.
let gameState = {
  // Player Profile
  isLoggedIn: false,
  agentName: 'Agent',
  rank: 'Recruit',
  xp: 0,
  level: 1,

  // Player Resources & Economy
  credits: 500,
  influence: 10,
  intel: 0,
  assets: {
    'Recon Drone': { count: 1, status: 'idle' },
    'SWAT Unit': { count: 0, status: 'idle' },
  },

  // World State & Factions
  worldState: {
    date: new Date(),
    globalStability: 75, // 0-100 scale
    factions: {
      'MI6': { standing: 50, allegiance: 'ally' },
      'Red Hand': { standing: 10, allegiance: 'enemy' },
      'Cygnus Corp': { standing: 30, allegiance: 'neutral' },
    },
    regions: {
      'London': { stability: 90, events: [] },
      'Kyiv': { stability: 60, events: [] },
      'Paris': { stability: 80, events: [] },
    }
  },

  // Game Content
  missions: [],
  contacts: [],
  mail: [],
  notifications: [],

  // Game Logic State
  cooldowns: {
    recon: 0,
    decrypt: 0,
    assetDeploy: 0,
  },
  lastMissionTime: 0,
};

// ====================
// UI CONTROLS & ELEMENTS
// ====================

const UI = {
  // Screens & Containers
  loginScreen: document.getElementById('login-screen'),
  dashboard: document.getElementById('dashboard'),
  mainPanes: document.querySelectorAll('.pane'),

  // Login UI
  passwordDisplay: document.getElementById('passwordDisplay'),
  progressBar: document.getElementById('progressBar'),
  authenticateBtn: document.getElementById('authenticateBtn'),

  // Dashboard UI
  toolBtns: document.querySelectorAll('.tool-btn'),
  backBtn: document.getElementById('backBtn'),
  
  // User & Resource Info
  displayName: document.getElementById('displayName'),
  rankDisplay: document.getElementById('rankDisplay'),
  xpDisplay: document.getElementById('xpDisplay'),
  creditsDisplay: document.getElementById('creditsDisplay'),
  influenceDisplay: document.getElementById('influenceDisplay'),

  // Pane-specific elements
  tasksList: document.getElementById('tasksList'),
  mailList: document.getElementById('mailList'),
  contactsList: document.getElementById('contactsList'),
  assetList: document.getElementById('assetList'),
  globalEventsList: document.getElementById('globalEventsList'),
  
  // A.N.N.A. AI Assistant
  aiChat: document.getElementById('ai-chat'),
  aiInput: document.getElementById('ai-input'),

  // Notifications
  notifBadge: document.getElementById('notif-count'),
  notificationsPanel: document.getElementById('notifications'),
  missionBanner: document.getElementById('missionBanner'),

  // Sounds
  sounds: {
    click: document.getElementById('click-sound'),
    loginSuccess: document.getElementById('login-success-sound'),
    notification: document.getElementById('notification-sound'),
    // ... add more sounds here
  },
};

// ====================
// GAME ENGINE & CONTROLS
// ====================

const gameEngine = {
  init: () => {
    gameEngine.loadState();
    gameEngine.setupListeners();
    gameEngine.updateUI();
    if (gameState.isLoggedIn) {
      gameEngine.showDashboard();
      gameEngine.startGameLoops();
    }
  },

  loadState: () => {
    const savedState = localStorage.getItem('agencyGameState');
    if (savedState) {
      Object.assign(gameState, JSON.parse(savedState));
      // Rehydrate the date object
      gameState.worldState.date = new Date(gameState.worldState.date);
    }
  },

  saveState: () => {
    localStorage.setItem('agencyGameState', JSON.stringify(gameState));
  },

  setupListeners: () => {
    UI.authenticateBtn.addEventListener('click', auth.authenticate);
    UI.toolBtns.forEach(btn => btn.addEventListener('click', () => {
      gameEngine.playSound(UI.sounds.click);
      gameEngine.switchPane(btn.dataset.tool);
    }));
    UI.backBtn.addEventListener('click', () => {
      gameEngine.playSound(UI.sounds.click);
      gameEngine.switchPane('tasks'); // Default back to tasks
    });
    UI.notifBtn.addEventListener('click', () => UI.notificationsPanel.classList.toggle('hidden'));
    UI.aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        ai.handleQuery(UI.aiInput.value);
        UI.aiInput.value = '';
      }
    });
  },

  switchPane: (toolName) => {
    UI.toolBtns.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tool="${toolName}"]`)?.classList.add('active');
    UI.mainPanes.forEach(pane => pane.classList.add('hidden'));
    document.getElementById(`pane-${toolName}`).classList.remove('hidden');

    // Pane-specific rendering
    if (toolName === 'tasks') missions.renderTasks();
    if (toolName === 'contacts') contacts.renderContacts();
    if (toolName === 'map') gameEngine.initMap();
    if (toolName === 'ai') ai.startTypingAnimation();
  },

  showDashboard: () => {
    UI.loginScreen.classList.add('hidden');
    UI.dashboard.classList.remove('hidden');
    document.body.classList.remove('locked');
  },

  startGameLoops: () => {
    setInterval(missions.checkNewMissions, 10000); // Check for new missions every 10s (for demo)
    setInterval(world.updateWorldState, 5000);   // Update world every 5s
    setInterval(gameEngine.updateUI, 1000);      // Update UI every 1s
  },
  
  updateUI: () => {
    UI.displayName.textContent = gameState.agentName;
    UI.rankDisplay.textContent = gameState.rank;
    UI.xpDisplay.textContent = gameState.xp;
    UI.creditsDisplay.textContent = gameState.credits;
    UI.influenceDisplay.textContent = gameState.influence;
    UI.notifBadge.textContent = gameState.notifications.length;
    UI.notifBadge.classList.toggle('hidden', gameState.notifications.length === 0);
  },

  playSound: (sound) => {
    // Logic to check settings and play sound
    if (true) { // Placeholder for settings check
      sound.currentTime = 0;
      sound.play();
    }
  },
  
  initMap: () => {
    if (!gameEngine.map) {
      gameEngine.map = L.map('map').setView([51.505, -0.09], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(gameEngine.map);
    }
    gameEngine.map.invalidateSize();
  },
};

// ====================
// AUTHENTICATION SYSTEM
// ====================

const auth = {
  authenticate: () => {
    gameEngine.playSound(UI.sounds.click);
    let password = "";
    const authInterval = setInterval(() => {
      password += "*";
      UI.passwordDisplay.textContent = password;
      UI.passwordDisplay.classList.add('active');
      UI.progressBar.style.width = `${(password.length / 8) * 100}%`;

      if (password.length >= 8) {
        clearInterval(authInterval);
        setTimeout(() => {
          gameEngine.playSound(UI.sounds.loginSuccess);
          gameState.isLoggedIn = true;
          gameEngine.saveState();
          gameEngine.showDashboard();
          gameEngine.startGameLoops();
          // Initialize map after dashboard is shown
          gameEngine.initMap(); 
        }, 500);
      }
    }, 150);
  }
};

// ====================
// WORLD & FACTION ENGINE
// ====================

const world = {
  updateWorldState: () => {
    // Dynamic changes to the world over time
    if (Math.random() < 0.1) { // 10% chance of a new event
      const newEvent = world.generateRandomEvent();
      world.addGlobalEvent(newEvent);
    }
    // Update faction standings based on player actions or time
    world.updateFactionStanding('Red Hand', -0.1);
    gameEngine.saveState();
  },
  
  addGlobalEvent: (event) => {
    // Add a global event and update the map overlay
    const li = document.createElement('li');
    li.textContent = `[${event.type}] ${event.description}`;
    UI.globalEventsList.appendChild(li);
    notifications.addNotification({
      title: `Global Alert: ${event.type}`,
      text: event.description,
      critical: event.critical,
    });
  },

  generateRandomEvent: () => {
    const eventTypes = ["Political Unrest", "Corporate Scandal", "Cyberattack"];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const eventDetails = {
      "Political Unrest": "Local protests have erupted in Kyiv, impacting stability.",
      "Corporate Scandal": "Cygnus Corp. is under investigation. Faction standing is shifting.",
      "Cyberattack": "A major cyberattack has been detected, affecting global networks."
    };
    return {
      type: eventType,
      description: eventDetails[eventType],
      critical: eventType === 'Cyberattack'
    };
  },

  updateFactionStanding: (factionName, amount) => {
    if (gameState.worldState.factions[factionName]) {
      gameState.worldState.factions[factionName].standing += amount;
      // Cap standing between 0 and 100
      gameState.worldState.factions[factionName].standing = Math.max(0, Math.min(100, gameState.worldState.factions[factionName].standing));
    }
  }
};

// ====================
// MISSION GENERATION & LOGIC
// ====================

const missions = {
  checkNewMissions: () => {
    const currentTime = Date.now();
    if (currentTime - gameState.lastMissionTime > 30000) { // New mission every 30s
      const newMission = missions.generateProceduralMission();
      gameState.missions.push(newMission);
      gameEngine.saveState();
      notifications.addNotification({
        title: "New Mission Briefing",
        text: newMission.title
      });
      gameState.lastMissionTime = currentTime;
    }
  },

  generateProceduralMission: () => {
    const tasks = ["Sabotage", "Infiltrate", "Extract", "Investigate"];
    const targets = ["Red Hand Cell", "Cygnus Corp. Executive", "Rogue AI Node"];
    const locations = Object.keys(gameState.worldState.regions);
    
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    return {
      id: `mission-${Date.now()}`,
      title: `${task} the ${target} in ${location}`,
      brief: `Your objective is to ${task.toLowerCase()} the ${target} located in the ${location} region. Our intel suggests this target is a critical part of a larger operation.`,
      status: "active",
      location: location,
      reward: Math.floor(Math.random() * 100) + 50
    };
  },

  renderTasks: () => {
    UI.tasksList.innerHTML = '';
    gameState.missions.filter(m => m.status === 'active').forEach(mission => {
      const taskItem = document.createElement('div');
      taskItem.className = 'list-item';
      taskItem.innerHTML = `<h4>${mission.title}</h4><p>Location: ${mission.location}</p>`;
      taskItem.addEventListener('click', () => missions.showBrief(mission));
      UI.tasksList.appendChild(taskItem);
    });
  },

  showBrief: (mission) => {
    gameEngine.switchPane('brief');
    UI.briefContent.innerHTML = `
      <h3>${mission.title}</h3>
      <p class="small">MISSION ID: ${mission.id}</p>
      <hr>
      <p><strong>Briefing:</strong> ${mission.brief}</p>
      <p><strong>Location:</strong> ${mission.location}</p>
      <p><strong>Reward:</strong> ${mission.reward} Credits</p>
      <hr>
      <button onclick="missions.completeMission('${mission.id}')">Complete Mission</button>
    `;
  },

  completeMission: (missionId) => {
    const mission = gameState.missions.find(m => m.id === missionId);
    if (mission) {
      gameState.xp += mission.reward;
      gameState.credits += mission.reward;
      mission.status = "completed";
      notifications.addNotification({
        title: "Mission Complete!",
        text: `You have completed "${mission.title}" and earned ${mission.reward} XP.`
      });
      gameEngine.playSound(UI.sounds.missionComplete);
      gameEngine.switchPane('tasks');
    }
  }
};

// ====================
// A.N.N.A. AI ASSISTANT
// ====================

const ai = {
  handleQuery: (query) => {
    if (query.trim() === '') return;
    ai.addMessageToChat(query, 'user');

    setTimeout(() => {
      let response = ai.generateResponse(query);
      ai.addMessageToChat(response, 'bot');
    }, 1500);
  },

  generateResponse: (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("hello") || lowerQuery.includes("hi")) {
      return `Hello, Agent ${gameState.agentName}. How can I assist you with your current tasks?`;
    }
    if (lowerQuery.includes("missions")) {
      const activeMissions = gameState.missions.filter(m => m.status === 'active').length;
      return `We currently have ${activeMissions} active mission(s). You can view them in the 'Tasks' pane.`;
    }
    if (lowerQuery.includes("credits")) {
      return `Your current credit balance is ${gameState.credits}.`;
    }
    if (lowerQuery.includes("status") || lowerQuery.includes("my profile")) {
      return `Agent Status:
- Rank: ${gameState.rank} (${gameState.xp} XP)
- Faction Standing (MI6): ${gameState.worldState.factions['MI6'].standing}
- Faction Standing (Red Hand): ${gameState.worldState.factions['Red Hand'].standing}`;
    }
    if (lowerQuery.includes("world state")) {
        return `The current global stability is at ${gameState.worldState.globalStability}%. Major events are occurring in ${Object.keys(gameState.worldState.regions).filter(r => gameState.worldState.regions[r].events.length > 0).join(', ')}.`;
    }
    return "I am sorry, Agent. My current data is insufficient to provide a meaningful response to that query.";
  },

  addMessageToChat: (message, sender) => {
    const chatMessage = document.createElement('div');
    chatMessage.className = `chat-message ${sender}`;
    chatMessage.textContent = message;
    UI.aiChat.appendChild(chatMessage);
    UI.aiChat.scrollTop = UI.aiChat.scrollHeight;
  },
  
  startTypingAnimation: () => {
    // Placeholder for a typing animation effect
    console.log('AI typing animation started.');
  }
};

// ====================
// CONTACTS & ASSETS
// ====================

const contacts = {
  renderContacts: () => {
    UI.contactsList.innerHTML = '';
    // This is where you would iterate through gameState.contacts to build the UI
    const mockContacts = [
      { name: 'Dr. Evelyn Reed', faction: 'MI6', status: 'Active' },
      { name: 'Marcus Thorne', faction: 'Red Hand', status: 'Compromised' },
    ];
    mockContacts.forEach(contact => {
      const contactItem = document.createElement('div');
      contactItem.className = 'list-item';
      contactItem.innerHTML = `<h4>${contact.name}</h4><p>Faction: ${contact.faction} | Status: ${contact.status}</p>`;
      UI.contactsList.appendChild(contactItem);
    });
  }
};

// ====================
// NOTIFICATIONS SYSTEM
// ====================

const notifications = {
  addNotification: (notif) => {
    gameState.notifications.unshift(notif);
    gameEngine.playSound(UI.sounds.notification);
    
    // Update badge count
    UI.notifBadge.textContent = gameState.notifications.length;
    
    // Render the notification panel item
    const notifItem = document.createElement('div');
    notifItem.className = 'notif-item';
    notifItem.innerHTML = `<h4>${notif.title}</h4><p>${notif.text}</p>`;
    UI.notificationsPanel.prepend(notifItem);
    
    // Show a banner for critical notifications
    if (notif.critical) {
      UI.missionBanner.textContent = `CRITICAL ALERT: ${notif.text}`;
      UI.missionBanner.classList.remove('hidden');
      gameEngine.playSound(UI.sounds.alertCritical);
      setTimeout(() => UI.missionBanner.classList.add('hidden'), 5000);
    }
  }
};

// ====================
// INITIALIZATION
// ====================

gameEngine.init();
