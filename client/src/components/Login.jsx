import React, { useState, useContext } from "react";
import loginLogo from '../assets/autoTracker-login-logo.png';
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContextProvider";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate(); // Initialize the navigate function

    const { login, error } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isLoggedIn = await login(username, password); // Call login function from context

        if (isLoggedIn) {
            navigate("/"); // Navigate to the dashboard on successful login
        }
    };

    return (
        <div className="flex min-h-full flex-1 bg-white dark:bg-gray-900 rounded-lg mt-16">
          <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div className="mx-auto w-full max-w-sm lg:w-96">
              <div>
                <span className="logo text-6xl" role="img">
                    🏎️
                </span>
                <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">Sign in to your account</h2>
              </div>

              <div className="mt-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                      Username
                    </label>
                    <div className="mt-2">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                        className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                      Password
                    </label>
                    <div className="mt-2">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Login
                    </button>
                  </div>
                </form>
                {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>
            </div>
          </div>
        <div className="relative hidden w-0 flex-1 lg:block">
            <div className="absolute inset-0 bg-white/10 backdrop-invert backdrop-opacity-10 rounded-lg">
            <img
                alt="Login"
                src={loginLogo}
                className="size-full object-cover rounded-lg mix-blend-overlay"
            />
            </div>
        </div>
        </div>
    );
}