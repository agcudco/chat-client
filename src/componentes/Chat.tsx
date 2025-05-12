// src/components/Chat.tsx

import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import io from 'socket.io-client';

// URL de conexión al servidor Socket.IO, definida en .env
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL!;

// Interfaz para los mensajes de chat
interface Message {
    author: string;
    content: string;
}

// Interfaz para la información de host/IP enviada por el servidor
interface HostInfo {
    host: string;
    ip: string;
}

export const Chat: React.FC = () => {

    // Estado temporal para el nickname mientras el usuario lo escribe
    const [tempNick, setTempNick] = useState<string>('');

    // Estado que almacena el nickname definitivo del usuario
    const [nickname, setNickname] = useState<string>('');

    // Indica si el socket ya se conectó y llegó la info de host
    const [connected, setConnected] = useState<boolean>(false);

    // Estado para guardar la información de host/IP recibida
    const [hostInfo, setHostInfo] = useState<HostInfo>({ host: '', ip: '' });

    // Estado del mensaje que el usuario va a enviar
    const [message, setMessage] = useState<string>('');

    // Historial de mensajes intercambiados
    const [messages, setMessages] = useState<Message[]>([]);

    // Referencia al socket, para poder usarlo en distintos callbacks
    const socketRef = useRef<any>(null);

    // Efecto que inicializa la conexión al servidor **solo** cuando el usuario elige un nickname
    useEffect(() => {

        // Si no hay nickname, no conectamos el socket
        if (!nickname) return;

        // Crear la conexión Socket.IO
        socketRef.current = io(SOCKET_SERVER_URL);

        // Escuchar el evento 'host_info' enviado por el servidor al conectar
        socketRef.current.on('host_info', (info: HostInfo) => {
            setHostInfo(info);      // Guardar host/IP en estado
            setConnected(true);     // Marcar como conectado
        });

        // Escuchar nuevos mensajes emitidos por el servidor
        socketRef.current.on('receive_message', (msg: Message) => {
            setMessages(prev => [...prev, msg]); // Añadir al historial
        });

        // Limpieza al desmontar el componente o cambiar de nickname
        return () => {
            socketRef.current.disconnect();
        };
    }, [nickname]);

    // Función que fija el nickname definitivo al pulsar el botón o Enter
    const handleSetNick = () => {
        const nick = tempNick.trim();
        if (!nick) return;       // No aceptamos nickname vacío
        setNickname(nick);        // Guardamos el nickname en estado
    };

    // Función para enviar un mensaje al servidor
    const sendMessage = () => {

        // No enviamos si no hay texto o no estamos conectados
        if (!message.trim() || !connected) return;

        // Creamos el objeto mensaje con el autor = nickname
        const msg = { author: nickname, content: message };

        // Emitimos al servidor
        socketRef.current.emit('send_message', msg);

        // También añadimos el mensaje al historial local
        setMessages(prev => [...prev, msg]);
        
        // Limpiamos el input de texto
        setMessage('');
    };

    // Si aún no se ha fijado nickname, mostramos el formulario de bienvenida
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
                                onChange={e => setTempNick(e.target.value)}        // Actualiza tempNick
                                onKeyDown={e => e.key === 'Enter' && handleSetNick()} // También al pulsar Enter
                                placeholder="Tu nickname"
                            />
                        </div>
                        <Button
                            label="Entrar al chat"
                            icon="pi pi-sign-in"
                            onClick={handleSetNick}  // Al hacer clic fijamos el nickname
                        />
                    </div>
                </Card>
            </div>
        );
    }

    // Una vez tenemos nickname, renderizamos la interfaz de chat
    return (
        <div className="app">
            <Card title={`Chat — ${nickname}`} className="chat-container">
                {/* Mostrar información de host e IP */}
                <div className="host-info">
                    Conectado desde: <strong>{hostInfo.host}</strong> ({hostInfo.ip})
                </div>

                {/* Contenedor de mensajes */}
                <div className="messages-container">
                    {messages.map((m, i) => (
                        <p
                            key={i}
                            className={`message ${m.author === nickname ? 'me' : 'other'}`}
                        >
                            <strong>{m.author}:</strong> {m.content}
                        </p>
                    ))}
                </div>

                {/* Área de entrada y botón */}
                <div className="input-area">
                    <InputTextarea
                        rows={2}
                        cols={30}
                        value={message}
                        onChange={e => setMessage(e.target.value)}         // Actualiza el mensaje
                        placeholder="Escribe un mensaje"
                        onKeyDown={e => e.key === 'Enter' && sendMessage()} // Enviar con Enter
                    />
                    <Button
                        label="Enviar"
                        icon="pi pi-send"
                        onClick={sendMessage}  // Al hacer clic enviamos el mensaje
                    />
                </div>
            </Card>
        </div>
    );
};
