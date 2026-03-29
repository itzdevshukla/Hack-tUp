import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // 'none' | 'verify' | 'setup'
    const [totpState, setTotpState] = useState('none');
    const navigate = useNavigate();

    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    const checkStatus = async () => {
        try {
            const response = await fetch('/api/auth/status/');
            const data = await response.json();
            if (data.is_authenticated) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth status check failed', error);
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const loginUser = async (e, onError) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        const csrftoken = getCookie('csrftoken');

        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.status === 429) {
                if (onError) onError(data.error || 'Too many login attempts. Please wait.');
                return;
            }

            if (data.success) {
                if (data.requires_totp_setup) {
                    setTotpState('setup');
                } else if (data.requires_totp) {
                    setTotpState('verify');
                } else {
                    setUser(data.user);
                    navigate('/dashboard');
                }
            } else {
                if (onError) onError(data.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login flow error', error);
            if (onError) onError('Connection error. Please try again.');
        }
    };

    // Called after TOTP verify/enable succeeds
    const completeTotpLogin = (userData) => {
        setUser(userData);
        setTotpState('none');
        if (userData.is_staff || userData.is_superuser) {
            navigate('/administration');
        } else if (userData.has_admin_access) {
            if (userData.assigned_event_id) {
                navigate('/administration/event/' + userData.assigned_event_id);
            } else {
                navigate('/administration/events');
            }
        } else {
            navigate('/dashboard');
        }
    };

    // Called when admin cancels TOTP — logs out the partial session
    const cancelTotpLogin = async () => {
        const csrftoken = getCookie('csrftoken');
        try {
            await fetch('/api/auth/logout/', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrftoken }
            });
        } catch { /* ignore */ }
        setTotpState('none');
        setUser(null);
    };

    const logoutUser = async () => {
        const csrftoken = getCookie('csrftoken');
        await fetch('/api/auth/logout/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken }
        });
        setUser(null);
        navigate('/login');
    };

    const contextData = {
        user,
        loading,
        totpState,
        loginUser,
        logoutUser,
        completeTotpLogin,
        cancelTotpLogin,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
