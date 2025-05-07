# Chat-App Client

Este README describe los pasos para crear y configurar la parte del **cliente** de tu aplicación de chat en tiempo real usando **React**, **TypeScript**, **PrimeReact** y **socket.io-client**.

---

## 1. Prerrequisitos

* **Node.js** (v14 o superior) y **npm** o **yarn**
* **npx** (incluido con Node.js)
* Editor de código (VSCode, WebStorm, etc.)

---

## 2. Estructura de carpetas

Dentro de la carpeta `chat-app` crea y ubica tu cliente en `client/`:

```
chat-app/
└── client/
    ├── .env
    ├── package.json
    ├── tsconfig.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.tsx
        ├── index.css
        ├── app.css
        ├── App.tsx
        └── components/
            └── Chat.tsx
```

---

## 3. Inicializar proyecto React

1. Desde la raíz del cliente, ejecuta:

   ```bash
   npx create-react-app client --template typescript
   cd client
   ```
2. Verifica que tienes los archivos `package.json` y `tsconfig.json` generados.

---

## 4. Instalar dependencias

En la carpeta `client`, instala PrimeReact, PrimeIcons, PrimeFlex y socket.io-client:

```bash
npm install primereact primeicons primeflex socket.io-client
```

---

## 5. Configuración de variables de entorno

1. Crea el archivo `.env` en la raíz de `client/` con:

   ```dotenv
   REACT_APP_SOCKET_SERVER_URL=http://localhost:3001
   ```
2. Asegúrate de añadir `.env` a tu `.gitignore` para no subir credenciales.

---

## 6. Importar estilos globales

Edita `src/index.css` y añade al inicio:

```css
@import "primereact/resources/themes/saga-blue/theme.css";
@import "primereact/resources/primereact.min.css";
@import "primeicons/primeicons.css";
@import "primeflex/primeflex.css";
```

---

## 7. Código del cliente

### `src/index.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';   // estilos PrimeReact
import './app.css';     // estilos personalizados

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/App.tsx`

```tsx
import React from 'react';
import { Chat } from './components/Chat';

const App: React.FC = () => (
  <div className="app">
    <Chat />
  </div>
);

export default App;
```

### `src/components/Chat.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL!;

interface Message { author: string; content: string; }
interface HostInfo { host: string; ip: string; }

export const Chat: React.FC = () => {
  const [tempNick, setTempNick] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [hostInfo, setHostInfo] = useState<HostInfo>({ host: '', ip: '' });
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<any>();

  useEffect(() => {
    if (!nickname) return;
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.on('host_info', (info: HostInfo) => {
      setHostInfo(info);
      setConnected(true);
    });
    socketRef.current.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => socketRef.current.disconnect();
  }, [nickname]);

  const handleSetNick = () => {
    const nick = tempNick.trim();
    if (!nick) return;
    setNickname(nick);
  };

  const sendMessage = () => {
    if (!message.trim() || !connected) return;
    const msg = { author: nickname, content: message };
    socketRef.current.emit('send_message', msg);
    setMessages(prev => [...prev, msg]);
    setMessage('');
  };

  if (!nickname) {
    return (
      <div className="app">
        <Card title="Bienvenido al Chat">
          <div className="p-fluid">
            <div className="p-field p-mb-3">
              <label htmlFor="nick">Elige un nickname:</label>
              <InputText
                id="nick"
                value={tempNick}
                onChange={e => setTempNick(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetNick()}
                placeholder="Tu nickname"
              />
            </div>
            <Button label="Entrar al chat" icon="pi pi-sign-in" onClick={handleSetNick} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="app">
      <Card title={`Chat — ${nickname}`} className="chat-container">
        <div className="host-info">
          Conectado desde: <strong>{hostInfo.host}</strong> ({hostInfo.ip})
        </div>
        <div className="messages-container">
          {messages.map((m, i) => (
            <p key={i} className={`message ${m.author === nickname ? 'me' : 'other'}`}>
              <strong>{m.author}:</strong> {m.content}
            </p>
          ))}
        </div>
        <div className="input-area">
          <InputTextarea rows={2} cols={30} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
          <Button label="Enviar" icon="pi pi-send" onClick={sendMessage} />
        </div>
      </Card>
    </div>
  );
};
```

---

## 8. Ejecutar el cliente

1. Instala dependencias (si no lo hiciste aún):

   ```bash
   npm install
   ```
2. Inicia la aplicación en modo desarrollo:

   ```bash
   npm start
   ```
3. Abre en el navegador: `http://localhost:3000`

---

## 9. Próximos pasos

* Personalizar tema y estilos en `app.css`.
* Añadir manejo de usuarios y salas.
* Integrar autenticación (JWT, OAuth).
* Conectar a una base de datos para persistir mensajes.

¡Listo! Ya puedes chatear en tiempo real desde tu cliente React.
