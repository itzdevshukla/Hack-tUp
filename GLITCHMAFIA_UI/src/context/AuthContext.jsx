import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Default to a logged-in user for convenience, or null to force login
    // Default to a logged-in user for convenience
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

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
            console.error("Auth status check failed", error);
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const loginUser = async (e) => {
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

            if (data.success) {
                setUser(data.user);
                if (data.user.is_staff || data.user.is_superuser) {
                    navigate('/administration');
                } else if (data.user.has_admin_access) {
                    if (data.user.assigned_event_id) {
                        navigate('/administration/event/' + data.user.assigned_event_id);
                    } else {
                        navigate('/administration/events');
                    }
                } else {
                    navigate('/dashboard');
                }
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error("Login flow error", error);
            alert("Login error");
        }
    };

    const logoutUser = async () => {
        const csrftoken = getCookie('csrftoken');
        await fetch('/api/auth/logout/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
        setUser(null);
        navigate('/login');
    };

    const contextData = {
        user,
        loading,
        loginUser,
        logoutUser
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
