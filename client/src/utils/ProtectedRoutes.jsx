import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContextProvider";

const ProtectedRoutes = () => {
    const { currentUser, loading } = useContext(UserContext);

    console.log("current User", currentUser);

    if (loading) {
        return <div>Loading...</div>;
    }

    return currentUser ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoutes;