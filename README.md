<h1 align="center">
  🖥️ Online Code Editor
</h1>

<p align="center">
  A powerful, browser-based IDE that lets you write, run, and preview code in <strong>19+ programming languages</strong> — all without leaving your browser.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io" />
  <img src="https://img.shields.io/badge/WebContainers-Powered-6B4FBB?style=for-the-badge&logo=stackblitz" />
  <img src="https://img.shields.io/badge/Monaco_Editor-IDE_Grade-007ACC?style=for-the-badge&logo=visual-studio-code" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

---

## ✨ Features

### 🚀 Multi-Language Code Execution
Run code directly in the browser across **19 languages** powered by the **Piston API**:

| Category | Languages |
|---|---|
| **Web & Scripting** | JavaScript, TypeScript, Python, PHP, Ruby, Perl, Bash |
| **Systems** | C, C++, Rust, Go |
| **Enterprise** | Java, Kotlin, C# |
| **Database** | SQLite |
| **Full-Stack Templates** | React + Vite, Node.js, Express.js, HTML/CSS/JS |

### 🌐 WebContainer-Powered Full-Stack Projects
- Instantly boot **React + Vite**, **Node.js**, **Express.js**, and **HTML** projects inside a real in-browser Node.js environment
- Live **Hot Module Replacement (HMR)** for React projects
- Built-in **Browser Preview** panel with live reload

### 📂 GitHub Integration
- **Import** any public GitHub repository and instantly boot it as a WebContainer project
- **Export** your project directly to a new GitHub repository with OAuth support

### 🗂️ Full File System Management
- Tree-based **File Explorer** with create, rename, and delete operations
- **Drag & Drop** files and folders from your OS directly into the editor
- **Multi-tab editor** for working across multiple files simultaneously
- **Dependencies Pane** to inspect `package.json` dependencies at a glance

### 🖥️ IDE-Grade Editor Experience
- Powered by **Monaco Editor** (the engine behind VS Code)
- Intelligent **syntax highlighting**, **IntelliSense**, and **auto-formatting**
- Configurable settings: font size, word wrap, minimap, format on paste
- **Dark / Light** theme toggle that remembers your preference

### ⚡ Integrated Terminal
- Real **xterm.js** terminal with full PTY support for interactive programs
- Terminal **resize** events synced with the backend PTY process
- Clear terminal output and stop/restart processes at any time

---

## 🏗️ Project Architecture

```
online-code-editor/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # UI components (Editor, Terminal, FileExplorer, etc.)
│       ├── services/     # WebContainer, GitHub, API, ProjectManager services
│       ├── types/        # TypeScript type definitions
│       └── utils/        # File drag & drop utilities
│
└── server/               # Node.js + Express backend
    ├── routes/           # REST API routes (/run)
    ├── services/         # PTY manager & project detector
    └── socket.js         # Socket.IO handler (code execution, PTY sessions)
```

**Data Flow:**
```
Browser (React)  ←──Socket.IO──→  Express Server  ←──→  Piston API (code execution)
     │                                                         
     └──── WebContainers API (in-browser Node.js for full-stack projects)
```

---

## 🚦 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A running instance of the [Piston API](https://github.com/engineer-man/piston) (or use the public one)

### 1. Clone the Repository

```bash
git clone https://github.com/anuragsinghmusics-wq/Online_Code_Editor.git
cd Online_Code_Editor
```

### 2. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

The server starts on **http://localhost:5000**

### 3. Start the Frontend Client

```bash
cd client
npm install
npm run dev
```

The client starts on **http://localhost:5173**

### 4. Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)** and start coding! 🎉

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **TypeScript** | Type safety |
| **Monaco Editor** | Code editor engine |
| **xterm.js** | In-browser terminal |
| **@webcontainer/api** | In-browser Node.js runtime |
| **Socket.IO Client** | Real-time communication |
| **Zustand** | State management |
| **react-resizable-panels** | Resizable layout panels |
| **Tailwind CSS v4** | Styling |
| **react-icons** | Language icons |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | HTTP server |
| **Socket.IO** | Real-time bidirectional communication |
| **node-pty** | Pseudo-terminal for interactive processes |
| **Piston API** | Sandboxed multi-language code execution |
| **Axios** | HTTP requests to Piston |

---

## 📸 Screenshots

> *Select a template on the Welcome Screen, write your code, and hit Run — it's that simple.*

---

## 🔧 Configuration

### Environment Variables

The server reads the following (optional) environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for the backend server |

### Editor Settings

All editor preferences are saved to `localStorage` and persist across sessions:
- **Font size**
- **Word wrap**
- **Minimap** visibility
- **Format on paste**

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source. Feel free to use it however you like.

---

<p align="center">
  Made with ❤️ using React, Node.js, and WebContainers
</p>
