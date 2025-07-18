import React, { useEffect, useState, useContext } from "react";
import { UserContext } from '../../context/UserContextProvider';
import CompletedInventoryCard from './CompletedInventoryCard';
import { useNavigate } from 'react-router-dom';
import Loading from "../../shared/Loading";

export default function CompletedInventories() {
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useContext(UserContext);
    const navigate = useNavigate();
    const isAdmin = currentUser?.admin === true;

    useEffect(() => {
        if (!currentUser?.id) return;
    
        fetch(`/api/user_inventories/history/${currentUser.id}`)
            .then(res => res.json())
            .then(data => {
                setInventories(data);
                setLoading(false);
            })
            .catch(err => {
                setLoading(false);
            });
    }, [currentUser]);

    if (loading) {
        return <Loading />;
    }

    return (
        <>
        <CompletedInventoryCard />
        </>
      
    );
}
