import React, { useState, useEffect } from "react";

const UserContext = React.createContext();

function UserContextProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch('/api/check_session')
            .then(resp => {
                if (resp.ok) {
                    resp.json().then(user => {
                        setCurrentUser(user);
                        setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            });
    }, []);

    const login = async (username, password) => {
        setError("");
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const userData = await response.json();
                setCurrentUser(userData);
                return true; // Successful login
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Login failed");
                return false; // Failed login
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            return false;
        }
    };

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser, loading, login, error }}>
            {children}
        </UserContext.Provider>
    );
}

export { UserContext, UserContextProvider };