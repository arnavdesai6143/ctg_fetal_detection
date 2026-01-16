import { io } from 'socket.io-client';
import { useState, useEffect, useRef, useCallback } from 'react';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

// Socket singleton
let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    }
    return socket;
};

export const connectSocket = () => {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
    return s;
};

export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect();
    }
};

// Hook for real-time CTG data
export const useRealtimeCTG = (patientId, maxPoints = 120) => {
    const [ctgData, setCTGData] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!patientId) return;

        const s = connectSocket();
        socketRef.current = s;

        // Connection handlers
        const onConnect = () => {
            setIsConnected(true);
            s.emit('subscribe-patient', patientId);
        };

        const onDisconnect = () => {
            setIsConnected(false);
        };

        // CTG data handler
        const onCTGUpdate = (point) => {
            setCTGData((prev) => {
                const updated = [...prev, point];
                // Keep only last maxPoints
                if (updated.length > maxPoints) {
                    return updated.slice(-maxPoints);
                }
                return updated;
            });
        };

        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);
        s.on('ctg-update', onCTGUpdate);

        // Connect if not already
        if (s.connected) {
            onConnect();
        }

        return () => {
            s.emit('unsubscribe-patient', patientId);
            s.off('connect', onConnect);
            s.off('disconnect', onDisconnect);
            s.off('ctg-update', onCTGUpdate);
        };
    }, [patientId, maxPoints]);

    const clearData = useCallback(() => {
        setCTGData([]);
    }, []);

    return { ctgData, isConnected, clearData };
};

// Hook for real-time alerts
export const useAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        const s = connectSocket();
        socketRef.current = s;

        const onAlert = (alert) => {
            setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
        };

        s.on('alert', onAlert);

        return () => {
            s.off('alert', onAlert);
        };
    }, []);

    const sendAlert = useCallback((patientId, message, severity = 'info') => {
        socketRef.current?.emit('patient-alert', { patientId, message, severity });
    }, []);

    const clearAlerts = useCallback(() => {
        setAlerts([]);
    }, []);

    return { alerts, sendAlert, clearAlerts };
};

export default { getSocket, connectSocket, disconnectSocket, useRealtimeCTG, useAlerts };
