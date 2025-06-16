import React, { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { PhotoIcon } from "@heroicons/react/24/outline";

export default function PhotoUploader({ carInventoryId, open, setOpen }) {
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
    <div>
      <Dialog open={open} onClose={setOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100">
                  <PhotoIcon className="size-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                    Upload Car Photo
                  </DialogTitle>
                  <form onSubmit={handleUpload} className="mt-4">
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-2" />
                    <button
                      type="submit"
                      className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Upload
                    </button>
                  </form>
                  {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Uploaded"
                      className="mt-4 max-w-xs border border-gray-300 rounded mx-auto"
                    />
                  )}
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

