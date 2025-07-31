import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom"
import { UserContext } from "../../context/UserContextProvider";


export default function Signup({ setUser }) {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [groupKey, setGroupKey] = useState(""); // Optional
  const [error, setError] = useState("");

  const { setCurrentUser } = useContext(UserContext);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Required for cookies/session
        body: JSON.stringify({
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          group_key: groupKey || undefined,
          is_owner_admin: true,
        }),
      });
  
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = "Signup failed.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch (_) {
          // fallback in case response isn't JSON
        }
        setError(errorMessage);
        return;
      }
  
      const userData = await response.json();
      console.log("User created:", userData);
      setCurrentUser(userData);
  
      // Force a full reload so the session cookie is respected
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Unexpected signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex min-h-full flex-1 bg-white dark:bg-gray-900 rounded-lg mt-16">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sign up for an account
          </h2>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900 dark:text-white">
                Email
              </label>
              <input
                id="username"
                name="username"
                type="email"
                maxLength={255}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 dark:text-white">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                maxLength={30}
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 dark:text-white">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                maxLength={30}
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Optional Group Key */}
            <div>
              <label htmlFor="groupKey" className="block text-sm font-medium text-gray-900 dark:text-white">
                Group Key <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="groupKey"
                name="groupKey"
                type="text"
                maxLength={12}
                value={groupKey}
                onChange={(e) => setGroupKey(e.target.value.toUpperCase())}
                className="mt-2 block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-white">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

