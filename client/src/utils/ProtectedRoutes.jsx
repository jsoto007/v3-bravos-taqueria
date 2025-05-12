import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContextProvider";

const ProtectedRoutes = () => {
    const { currentUser, loading } = useContext(UserContext);

    console.log("current User", currentUser);

    if (loading) {
        return <div>Loading...</div>; // Show loading indicator or placeholder while data is fetched
    }

    return currentUser ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoutes;