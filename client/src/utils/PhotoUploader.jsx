import React, { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { PhotoIcon } from "@heroicons/react/24/outline";

export default function PhotoUploader({ carInventoryId, open, setOpen }) {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [photoUrls, setPhotoUrls] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleUpload = async () => {
    if (!files.length) {
      setMessage("Please select at least one photo.");
      return;
    }

    console.log("from uploader", carInventoryId)
    
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("master_car_record_id", carInventoryId);

        const response = await fetch("http://localhost:5555/api/upload_photo", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        } else {
          throw new Error("Upload failed for one or more files.");
        }
      }

      setMessage("Photo(s) uploaded successfully!");
      setPhotoUrls((prev) => [...prev, ...uploadedUrls]);
      setFiles([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("An error occurred while uploading.");
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
                    Upload Car Photo(s)
                  </DialogTitle>
                  <form className="mt-4">
                    <div className="mb-2">
                      <label className="block w-full cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 text-center">
                        Select Photo(s)
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files);
                            setFiles((prev) => [...prev, ...newFiles]);
                            setPreviewUrls((prev) => [...prev, ...newFiles.map(file => URL.createObjectURL(file))]);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {previewUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {previewUrls.map((url, i) => (
                          <div key={i} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${i + 1}`}
                              className="w-full h-32 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFiles((prev) => prev.filter((_, index) => index !== i));
                                setPreviewUrls((prev) => prev.filter((_, index) => index !== i));
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleUpload}
                      className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Upload
                    </button>
                  </form>
                  {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {photoUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Uploaded ${i + 1}`}
                        className="max-w-full border border-gray-300 rounded"
                      />
                    ))}
                  </div>
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