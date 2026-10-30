# Quick Start: Running CrewHub in Visual Studio Code

This guide explains how to open, run, and present the CrewHub codebase directly in **Visual Studio Code (VS Code)**.

---

## Step 1: Open the Project in VS Code

1. Download or export this project folder to your computer.
2. Launch **Visual Studio Code**.
3. In the top menu, click **File > Open Folder...** (or press `Ctrl+K Ctrl+O` on Windows / `Cmd+O` on macOS).
4. Select the project folder (`crewhub`).
5. In VS Code's left sidebar (Explorer), you will see the complete project structure:
   ```text
   crewhub/
   ├── src/
   │   ├── components/         # All UI modules (BrowseProjects, CreateTeam, Dashboard, Chat)
   │   ├── data/taxonomy.ts    # Skills taxonomy, role definitions & deterministic matching
   │   ├── firebase.ts         # Cloud Firestore database & Auth connection
   │   └── App.tsx             # Main application router & state
   ├── server/
   │   └── api.ts              # REST API (PBKDF2 hashing, GitHub sync, URL verification)
   ├── scripts/
   │   └── inspect-db.ts       # Database inspection CLI tool
   ├── firebase-applet-config.json # Cloud Firestore database configuration
   ├── package.json            # Project dependencies and scripts
   └── README.md               # Complete academic documentation & architecture report
   ```

---

## How Changes Made Here Sync to Your Local VS Code

Because AI Studio runs in a cloud environment and VS Code runs locally on your computer, here is how synchronization works:

### 1. Database Data (Syncs Automatically & Instantly)
- **Zero manual action needed.**
- The Google Cloud Firebase Firestore database (`ai-studio-7159676d-a8c7-49af-ac2e-45a72f2d331b`) is live in the cloud.
- Any project created, user account registered, join request submitted, or chat message sent in the app will appear **immediately in both places** because both environments point to the exact same cloud database instance.

### 2. Code Changes (Getting New Code into VS Code)
Whenever you ask for code modifications, UI updates, or logic tweaks here, get them into your VS Code through either of these methods:

- **Method A: Download the Updated Code (Direct & Fast)**
  1. Click the **Export / Download** button in the top-right header of AI Studio.
  2. Select **Download ZIP**.
  3. Extract and overwrite the files in your local `crewhub` folder.
  4. VS Code will automatically reload the modified files.

- **Method B: Git & GitHub (Recommended for Faculty Demonstrations)**
  1. Connect this project to a GitHub repository using the **Export to GitHub** button.
  2. In your VS Code terminal, whenever changes are made here, simply run:
     ```bash
     git pull
     ```
  3. All updated files will be fetched and merged into your local VS Code workspace in seconds.

---

## Step 2: Open VS Code Integrated Terminal

1. Press **``Ctrl + ` ``** (Backtick) on your keyboard, or go to **Terminal > New Terminal** in the top menu.
2. The terminal will open at the bottom of your VS Code window.

---

## Step 3: Install Dependencies

In the VS Code terminal, run:
```bash
npm install
```
This installs all required packages (React 19, TypeScript, Express, Firebase SDK, Tailwind CSS, Lucide icons).

---

## Step 4: Verify Live Cloud Database Connectivity

Before launching the app, verify that your cloud database is online and reachable by running:
```bash
npm run db:status
```
You will see output in the VS Code terminal:
```text
======================================================
   CrewHub Firestore Database Inspection Utility     
======================================================
Project ID:        divine-link-k61jg
Database Instance: ai-studio-7159676d-a8c7-49af-ac2e-45a72f2d331b
Auth Domain:       divine-link-k61jg.firebaseapp.com
------------------------------------------------------
Querying cloud Firestore collections in real time...

Collection [users         ]: 4 live document(s)
Collection [projects      ]: 1 live document(s)
Collection [joinRequests  ]: 1 live document(s)
Collection [messages      ]: 0 live document(s)

Database status: HEALTHY & CONNECTED
======================================================
```

---

## Step 5: Start the Development Server

In the VS Code terminal, run:
```bash
npm run dev
```

You will see:
```text
  VITE v8.3.0  ready in 250 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Hold `Ctrl` (or `Cmd`) and click `http://localhost:3000/`, or paste it into your browser.

---

## Step 6: How to Present Directly from VS Code to Faculty

When demonstrating the project from VS Code:

1. **Show the Project Architecture**:
   - Open `src/data/taxonomy.ts` to show the **Canonical Skills Taxonomy** (hardware/software aliases like ESP32, Arduino, C++, DS18B20) and the **Deterministic Matching Algorithm** (50% skills, 25% roles, 15% domains, 10% fit).
   - Open `src/firebase.ts` to show how the app initializes Google Cloud Firebase Firestore with real-time snapshot listeners.
   - Open `server/api.ts` to show PBKDF2 password hashing and live GitHub REST API v3 integration.
2. **Show the Database in Terminal**:
   - Run `npm run db:status` in the VS Code terminal to prove that the app is connected to a live Google Cloud Firestore NoSQL database storing real student documents.
3. **Show Real-Time Synchronization**:
   - Open two browser tabs side-by-side (`http://localhost:3000`).
   - Create a project ticket in Tab 1; show it appearing immediately in Tab 2 without refreshing.
   - Send a join request from Tab 2; show the leader dashboard in Tab 1 update with the applicant in real time.
