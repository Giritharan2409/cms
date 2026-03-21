import { useEffect, useRef } from 'react';

function resolveWebSocketUrl() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL || '';

  if (configuredBase && /^https?:\/\//i.test(configuredBase)) {
    return `${configuredBase.replace(/^http/i, 'ws').replace(/\/$/, '')}/ws/settings`;
  }

  const origin = window.location.origin.replace(/^http/i, 'ws');
  return `${origin}/ws/settings`;
}

export function useSettingsRealtime(userId, onSettingsUpdated) {
  const callbackRef = useRef(onSettingsUpdated);

  useEffect(() => {
    callbackRef.current = onSettingsUpdated;
  }, [onSettingsUpdated]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let reconnectTimer = null;
    let heartbeatTimer = null;
    let socket = null;

    function connect() {
      socket = new WebSocket(resolveWebSocketUrl());

      socket.onopen = () => {
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 20000);
      };

      socket.onmessage = (event) => {
        let payload = null;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!payload || payload.type !== 'SETTINGS_UPDATED') {
          return;
        }

        if (payload.user_id !== userId && payload.user_id !== 'ALL') {
          return;
        }

        callbackRef.current?.(payload);
      };

      socket.onclose = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }

        reconnectTimer = setTimeout(connect, 2200);
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userId]);
}
