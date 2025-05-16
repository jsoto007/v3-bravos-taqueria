import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import PhotoGallery from "../shared/PhotoGellery";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <>
            <PhotoGallery />
        </>
        // <>
        //     {isLogin ? <Login /> : <Signup />}
        //     <button onClick={() => setIsLogin(!isLogin)}>
        //         {isLogin ? "Create an Account" : "Log In"}
        //     </button>
        // </>
    );
}