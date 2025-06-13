import React, { useState } from "react";

export default function PhotoUploader({ carInventoryId }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    // formData.append("master_car_record_id", carInventoryId); // adjust if needed
    formData.append("master_car_record_id", 12); // adjust if needed

    const response = await fetch("http://localhost:5555/api/upload_photo", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setMessage("Photo uploaded successfully!");
    } else {
      setMessage("Upload failed.");
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit">Upload</button>
      {message && <p>{message}</p>}
    </form>
  );
}

