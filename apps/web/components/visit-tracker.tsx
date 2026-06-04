'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const visitSessionKey = 'cocoesencia_visit_session';

function createSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    const existingSession = window.sessionStorage.getItem(visitSessionKey);
    if (existingSession) return;

    const visitorSessionId = createSessionId();
    window.sessionStorage.setItem(visitSessionKey, visitorSessionId);

    fetch('/api/backend/site-visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || undefined, visitorSessionId }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}