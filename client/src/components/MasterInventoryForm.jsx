import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MasterInventoryForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vin_number: "",
    location: "",
    year: "",
    make: "",
    purchase_price: "",
    selling_price: "",
    sold_price: "",
    is_sold: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!/^\d{4}$/.test(formData.year)) {
      newErrors.year = "Year must be a 4-digit number.";
    }

    const validateNumber = (field, name, allowNull = true) => {
      if (formData[field] === "" && allowNull) return;
      const value = formData[field].replace(/,/g, "");
      if (!/^\d+(\.\d+)?$/.test(value)) {
        newErrors[field] = `${name} must be a valid number.`;
      }
    };

    validateNumber("purchase_price", "Purchase Price");
    validateNumber("selling_price", "Selling Price");
    validateNumber("sold_price", "Sold Price");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Convert number strings to floats, remove commas, and handle empty strings
    const sanitizeNumber = (val) =>
      val === "" ? null : parseFloat(val.replace(/,/g, ""));

    const payload = {
      ...formData,
      purchase_price: sanitizeNumber(formData.purchase_price),
      selling_price: sanitizeNumber(formData.selling_price),
      sold_price: sanitizeNumber(formData.sold_price),
    };

    // Trigger the request in the background
    fetch("/api/master_inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((result) => {
        console.log("Successfully added record:", result);
        navigate("/master_inventory");
      })
      .catch((err) => setErrors(err));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className=" mt-10 max-w-2xl mx-auto p-4 bg-white dark:bg-gray-800 shadow-md rounded-md"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Master Inventory Form
      </h2>

      {[
        { label: "VIN Number", name: "vin_number" },
        { label: "Location", name: "location" },
        { label: "Year", name: "year" },
        { label: "Make", name: "make" },
        { label: "Purchase Price", name: "purchase_price" },
        { label: "Selling Price", name: "selling_price" },
        { label: "Sold Price", name: "sold_price" },
      ].map(({ label, name }) => (
        <div className="mb-4" key={name}>
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
          <input
            type="text"
            name={name}
            id={name}
            value={formData[name]}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${
              errors[name] ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100`}
          />
          {errors[name] && (
            <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
          )}
        </div>
      ))}

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          name="is_sold"
          id="is_sold"
          checked={formData.is_sold}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          htmlFor="is_sold"
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          Is Sold
        </label>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Submit
      </button>
    </form>
  );
}