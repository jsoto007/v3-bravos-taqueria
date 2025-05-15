import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContextProvider";
import Loading from "../shared/Loading";

const ProtectedRoutes = () => {
    const { currentUser, loading } = useContext(UserContext);

    console.log("current User", currentUser);

    if (loading) {
        return <Loading />;
    }

    return currentUser ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoutes;