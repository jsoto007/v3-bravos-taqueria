import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContextProvider';

export default function Logout() {
    const navigate = useNavigate();

    const { setCurrentUser } = useContext(UserContext)

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', {
                method: 'DELETE',
            });

            if (response.ok) {
                setCurrentUser(null)
                navigate('/auth');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
            <button className="text-sm" onClick={handleLogout}>Logout</button>
    );
}
