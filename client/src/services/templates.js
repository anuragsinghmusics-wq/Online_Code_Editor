export const templates = {
  react: {
    id: 'react',
    name: 'React + Vite',
    language: 'javascript',
    files: {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'react-vite-app',
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.2.1',
              vite: '^5.2.0'
            }
          }, null, 2)
        }
      },
      'vite.config.js': {
        file: {
          contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`
        }
      },
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
        }
      },
      'src': {
        directory: {
          'main.jsx': {
            file: {
              contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
            }
          },
          'App.jsx': {
            file: {
              contents: `import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './style.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App`
            }
          },
          'style.css': {
            file: {
              contents: `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  background-color: #242424;
  color: rgba(255, 255, 255, 0.87);
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`
            }
          },
          'assets': {
            directory: {
              'react.svg': {
                file: {
                  contents: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348"><circle cx="0" cy="0" r="2.05" fill="#61dafb"/><g stroke="#61dafb" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`
                }
              }
            }
          }
        }
      },
      'public': {
        directory: {
          'vite.svg': {
            file: {
              contents: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 118" fill="none"><path d="M117.828 29.8394C117.683 29.3512 117.294 28.9715 116.804 28.8354L60.0151 13.0645C59.3524 12.8804 58.6476 12.8804 57.9849 13.0645L1.196 28.8354C0.705999 28.9715 0.316999 29.3512 0.171999 29.8394C0.0359986 30.3156 0.157999 30.8258 0.490999 31.1896L57.481 93.3986C58.261 94.2501 59.739 94.2501 60.519 93.3986L117.509 31.1896C117.842 30.8258 117.964 30.3156 117.828 29.8394Z" fill="url(#paint0_linear_1402_19)"/><path d="M117.828 29.8394C117.683 29.3512 117.294 28.9715 116.804 28.8354L60.0151 13.0645C59.3524 12.8804 58.6476 12.8804 57.9849 13.0645L1.196 28.8354C0.705999 28.9715 0.316999 29.3512 0.171999 29.8394C0.0359986 30.3156 0.157999 30.8258 0.490999 31.1896L57.481 93.3986C58.261 94.2501 59.739 94.2501 60.519 93.3986L117.509 31.1896C117.842 30.8258 117.964 30.3156 117.828 29.8394Z" fill="url(#paint1_linear_1402_19)"/><defs><linearGradient id="paint0_linear_1402_19" x1="6" y1="21.5" x2="60.5" y2="92" gradientUnits="userSpaceOnUse"><stop stop-color="#41D1FF"/><stop offset="1" stop-color="#BD34FE"/></linearGradient><linearGradient id="paint1_linear_1402_19" x1="112" y1="21.5" x2="60.5" y2="92" gradientUnits="userSpaceOnUse"><stop stop-color="#FFEA83"/><stop offset="0.0833333" stop-color="#FFDD35"/><stop offset="1" stop-color="#FFA800"/></linearGradient></defs></svg>`
            }
          }
        }
      },
      'README.md': {
        file: {
          contents: `# React + Vite WebContainer Template\n\nThis is a minimal React template powered by Vite running completely in the browser via WebContainers.`
        }
      }
    }
  },
  html: {
    id: 'html',
    name: 'HTML/CSS/JS',
    language: 'html',
    files: {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'html-project',
            version: '1.0.0',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            devDependencies: {
              vite: '^5.2.0'
            }
          }, null, 2)
        }
      },
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HTML Project</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <div class="container">
      <h1>Hello WebContainers!</h1>
      <p>This is a standard HTML project served by Vite.</p>
      <button id="counterBtn">Click me</button>
      <p id="counterVal">Count: 0</p>
    </div>
    <script type="module" src="/script.js"></script>
  </body>
</html>`
        }
      },
      'style.css': {
        file: {
          contents: `body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 2rem;
  background-color: #fdfdfd;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}`
        }
      },
      'script.js': {
        file: {
          contents: `let count = 0;
const btn = document.getElementById('counterBtn');
const val = document.getElementById('counterVal');

btn.addEventListener('click', () => {
  count++;
  val.textContent = \`Count: \${count}\`;
});`
        }
      },
      'README.md': {
        file: {
          contents: `# HTML Template\n\nA simple HTML, CSS, and JS project powered by Vite.`
        }
      }
    }
  },
  nodejs: {
    id: 'nodejs',
    name: 'Node.js',
    language: 'nodejs',
    files: {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'node-project',
            version: '1.0.0',
            scripts: {
              dev: 'nodemon server.js'
            },
            devDependencies: {
              nodemon: '^3.1.0'
            }
          }, null, 2)
        }
      },
      'server.js': {
        file: {
          contents: `const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Hello from Node.js in WebContainers!</h1>');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server is running on port \${PORT}\`);
});`
        }
      },
      'README.md': {
        file: {
          contents: `# Node.js Template\n\nA vanilla Node.js HTTP server.`
        }
      }
    }
  },
  express: {
    id: 'express',
    name: 'Express.js',
    language: 'nodejs',
    files: {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'express-project',
            version: '1.0.0',
            scripts: {
              dev: 'nodemon server.js'
            },
            dependencies: {
              express: '^4.19.0'
            },
            devDependencies: {
              nodemon: '^3.1.0'
            }
          }, null, 2)
        }
      },
      'server.js': {
        file: {
          contents: `const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Hello from Express in WebContainers!</h1>');
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Express server listening on port \${PORT}\`);
});`
        }
      },
      'README.md': {
        file: {
          contents: `# Express.js Template\n\nA simple Express.js application.`
        }
      }
    }
  }
};
