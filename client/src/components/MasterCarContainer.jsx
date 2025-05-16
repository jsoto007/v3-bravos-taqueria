import PhotoGallery from "../shared/PhotoGellery"

export default function MasterCarContainer() {
    return (
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:px-6">
          <h1>BMW 2077   |   VIN 23423425lk2345K</h1>
          <PhotoGallery />
        </div>
        <div className="px-4 py-5 sm:p-6"><h1>Is this the center</h1></div>
        <div className="px-4 py-4 sm:px-6">
          <h1>Is this the button?</h1>
          {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
        </div>
      </div>
    )
  }
  