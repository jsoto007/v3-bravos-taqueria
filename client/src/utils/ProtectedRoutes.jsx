import { Outlet, Navigate } from "react-router-dom";


const ProtactedRoutes = () => {
    const user = null

    return user ? <Outlet /> : <Navigate to="/" />
};

export default ProtactedRoutes;