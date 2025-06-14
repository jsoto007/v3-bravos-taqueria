import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";


export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <>
           <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white my-8">Auto Tracker</h1>
            {isLogin ? <Login /> : <Signup />}
            <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Create an Account" : "Log In"}
            </button>
        </>
    );
}
