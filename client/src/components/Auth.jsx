import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <>
            {isLogin ? <Login /> : <Signup />}
            <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Create an Account" : "Log In"}
            </button>
        </>
    );
}