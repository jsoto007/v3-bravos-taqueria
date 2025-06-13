import React, { useState } from "react";

export default function PhotoUploader({ carInventoryId }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

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
      const data = await response.json();
      setMessage("Photo uploaded successfully!");
      setPhotoUrl(data.url);
    } else {
      setMessage("Upload failed.");
      setPhotoUrl("");
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit">Upload</button>
      {message && <p>{message}</p>}
      {photoUrl && (
        <img
          src={photoUrl}
          alt="Uploaded"
          className="mt-4 max-w-xs border border-gray-300 rounded"
        />
      )}
    </form>
  );
}

