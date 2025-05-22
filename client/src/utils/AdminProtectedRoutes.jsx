import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContextProvider";
import Loading from "../shared/Loading";

const AdminProtectedRoutes = () => {
    const { currentUser, loading } = useContext(UserContext);

    if (loading) {
        return <Loading />;
    }

    return currentUser && currentUser.admin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminProtectedRoutes;
