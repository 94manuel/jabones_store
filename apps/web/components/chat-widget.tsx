'use client';
import { FormEvent, useState } from 'react';
interface Message { role: 'assistant' | 'user'; text: string; }
export function ChatWidget() {
  const [open, setOpen] = useState(false); const [text, setText] = useState(''); const [sessionId, setSessionId] = useState<string>(); const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'Hola, soy el asistente CocoEsencia. ¿Qué jabón estás buscando?' }]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!text.trim() || loading) return; const message = text.trim(); setMessages((m) => [...m, { role: 'user', text: message }]); setText(''); setLoading(true);
    try { const response = await fetch('/api/backend/chat/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, sessionId }) }); const data = await response.json(); setSessionId(data.sessionId); setMessages((m) => [...m, { role: 'assistant', text: data.output ?? 'No pude responder en este momento.' }]); }
    catch { setMessages((m) => [...m, { role: 'assistant', text: 'No fue posible conectar con el asistente.' }]); } finally { setLoading(false); }
  }
  return <div className={`chat ${open ? 'open' : ''}`}>
    {open && <div className="chat-panel"><div className="chat-head"><strong>Asistente CocoEsencia</strong><button onClick={() => setOpen(false)}>×</button></div><div className="chat-body">{messages.map((msg, i) => <p key={i} className={msg.role}>{msg.text}</p>)}{loading && <p className="assistant">Escribiendo…</p>}</div><form className="chat-form" onSubmit={submit}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu mensaje" maxLength={1000}/><button aria-label="Enviar">➤</button></form></div>}
    {!open && <button className="chat-launch" onClick={() => setOpen(true)}>💬 ¿Necesitas ayuda?</button>}
  </div>;
}
