import { useEffect, useState } from "react";

export default function AdminCarEdit({ car, onSave }) {
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

    useEffect(() => {
        if (car) {
            setFormData({
                vin_number: car.vin_number || "",
                location: car.location || "",
                year: car.year || "",
                make: car.make || "",
                purchase_price: car.purchase_price || "",
                selling_price: car.selling_price || "",
                sold_price: car.sold_price || "",
                is_sold: car.is_sold || false,
            });
        }
    }, [car]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/master_inventory/${car.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to update car");

            const updatedCar = await res.json();
            onSave(updatedCar);
        } catch (error) {
            console.error(error);
            alert("There was a problem updating the car.");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-6 divide-y-4 divide-gray-200 font-mono dark:divide-gray-700 overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white"
        >
            <div className="p-4 sm:p-6">
                <h1 className="text-xl font-bold mb-2 font-serif">
                    Editing: {formData.make} {formData.year}
                </h1>
            </div>
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: "VIN", name: "vin_number" },
                        { label: "Location", name: "location" },
                        { label: "Year", name: "year" },
                        { label: "Make", name: "make" },
                        { label: "Purchased Price", name: "purchase_price" },
                        { label: "Selling Price", name: "selling_price" },
                        { label: "Sold Price", name: "sold_price" },
                    ].map(({ label, name }) => (
                        <div key={name}>
                            <label className="block font-medium mb-1">{label}</label>
                            <input
                                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                type="text"
                                name={name}
                                value={formData[name]}
                                onChange={handleChange}
                            />
                        </div>
                    ))}
                    <div>
                        <label className="block font-medium mb-1">Is Sold</label>
                        <input
                            type="checkbox"
                            name="is_sold"
                            checked={formData.is_sold}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
            <div className="p-4 sm:p-6 flex flex-row items-center">
                <button
                    type="submit"
                    className="mr-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
}