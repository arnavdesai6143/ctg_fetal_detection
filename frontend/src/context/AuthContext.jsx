import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('ctg_token');
        const savedUser = localStorage.getItem('ctg_user');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('ctg_token');
                localStorage.removeItem('ctg_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await authAPI.login(email, password);

            if (response.data.success) {
                const { user: userData, token } = response.data;

                localStorage.setItem('ctg_token', token);
                localStorage.setItem('ctg_user', JSON.stringify(userData));
                setUser(userData);

                return { success: true };
            } else {
                const errorMsg = response.data.error || 'Login failed';
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Invalid email or password';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Call backend logout to invalidate session
            await authAPI.logout();
        } catch (err) {
            // Continue with local logout even if API fails
            console.error('Logout API error:', err);
        } finally {
            // Always clear local storage and state
            localStorage.removeItem('ctg_token');
            localStorage.removeItem('ctg_user');
            setUser(null);
            setError(null);

            // Force redirect to login
            window.location.href = '/login';
        }
    };

    const forgotPassword = async (email) => {
        setError(null);

        try {
            const response = await authAPI.forgotPassword(email);
            return { success: true, message: response.data.message };
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to send reset email';
            return { success: false, error: errorMsg };
        }
    };

    const resetPassword = async (token, newPassword) => {
        setError(null);

        try {
            const response = await authAPI.resetPassword(token, newPassword);
            return { success: true, message: response.data.message };
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to reset password';
            return { success: false, error: errorMsg };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        setError(null);

        try {
            const response = await authAPI.changePassword(currentPassword, newPassword);
            return { success: true, message: response.data.message };
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to change password';
            return { success: false, error: errorMsg };
        }
    };

    const value = {
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isClinician: user?.role === 'clinician',
        login,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
