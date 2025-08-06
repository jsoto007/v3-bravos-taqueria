import { useState } from "react";

export default function AdminSignupUser() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    admin: false,
  });

  const [status, setStatus] = useState(null);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedForm = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(updatedForm);

    if (name === "password" || name === "confirm_password") {
      setPasswordsMatch(updatedForm.password === updatedForm.confirm_password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
      const res = await fetch("/api/admin/create_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("User created successfully.");
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          confirm_password: "",
          admin: false,
        });
      } else {
        setStatus(data.error || "Failed to create user.");
      }
    } catch (error) {
      setStatus("Server error.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-md mx-auto mt-10 p-6 border border-gray-300 dark:border-gray-700 rounded-md shadow-md bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Create New User
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
              required
            />
            {formData.confirm_password && (
              <p className={`text-sm ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="admin"
              checked={formData.admin}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="font-medium text-gray-900 dark:text-gray-200">Grant Admin Access</label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Create User
          </button>
          {status && (
            <p className="text-center mt-4 text-gray-900 dark:text-gray-100">
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}