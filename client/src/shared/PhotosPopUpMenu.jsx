import { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import PhotoUploader from '../utils/PhotoUploader'
import PhotoDeleter from './PhotoDeleter';

export default function PhotosPopUpMenu( { carInventoryId, selectedPhoto } ) {

  const [open, setOpen] = useState(false)
  const [showDeleter, setShowDeleter] = useState(false)


  console.log("SL PHOTO ID", selectedPhoto.id)

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <MenuButton className="flex items-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900">
            <span className="sr-only">Open options</span>
            <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
          </MenuButton>
        </div>

        <MenuItems
          transition
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
        >
          <div className="py-1">
            <MenuItem>
              <button
                onClick={() => setOpen(true)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 dark:data-[focus]:bg-gray-700 dark:data-[focus]:text-white data-[focus]:outline-none"
              >
                Add New Photo
              </button>
            </MenuItem>

            <MenuItem>
              <button
                onClick={() => setShowDeleter(true)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 dark:data-[focus]:bg-gray-700 dark:data-[focus]:text-white data-[focus]:outline-none"
              >
                Delete Selected Photo
              </button>
            </MenuItem>
            <form action="#" method="POST">
            </form>
          </div>
        </MenuItems>
      </Menu>
      {open && <PhotoUploader carInventoryId={carInventoryId} open={open} setOpen={setOpen} />}
      {showDeleter && selectedPhoto && (
        <PhotoDeleter 
          photoId={selectedPhoto?.id} 
          onDeleteSuccess={() => setShowDeleter(false)} 
        />
      )}
    </>
  )
}
