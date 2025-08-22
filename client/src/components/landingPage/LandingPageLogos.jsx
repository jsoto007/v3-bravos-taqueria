// Removed useEffect and useState imports

export default function LandingPageLogos() {
    return (
      <div className="py-6 sm:py-32 rounded-sm bg-white dark:bg-slate-500/10">
        <div className="mx-auto max-w-7xl px-2 lg:px-8">
          <div className="-mx-6 grid grid-cols-2 gap-0.5 overflow-hidden sm:mx-0 sm:rounded-2xl md:grid-cols-3">
            <div className="bg-gray-400/5 p-6 sm:p-10">
                <a href="https://react.dev/" target="_blank">
                    <img
                        alt="React"
                        src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
                        width={158}
                        height={48}
                        className="max-h-32 w-full object-contain"
                    />
                </a>
            </div>
            <div className="bg-gray-400/5 p-6 sm:p-10">
              <a href="https://locationiq.com" target="_blank" rel="noopener noreferrer" className="inline-block w-full">
                <img
                  alt="LocationIQ"
                  src="https://images.g2crowd.com/uploads/product/image/social_landscape/social_landscape_3278747781bb9c71879dd510257e0ddf/locationiq.png"
                  width={158}
                  height={48}
                  className="max-h-32 w-full -py-12 object-contain"
                />
              </a>
            </div>
            <div className="bg-gray-400/5 p-6 sm:p-10">
                <a href="https://vite.dev/" target="_blank">
                    <img
                        alt="Vite"
                        src="https://vite.dev/logo.svg"
                        width={158}
                        height={48}
                        className="max-h-32 w-full object-contain"
                    />
                </a>
            </div>
            <div className="bg-gray-400/5 p-6 sm:p-10">
                <a href="https://www.python.org/" target="_blank">
                    <img
                        alt="Python"
                        src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg"
                        width={158}
                        height={48}
                        className="max-h-32 w-full object-contain"
                    />
                </a>
            </div>
            <div className="bg-gray-400/5 p-6 sm:p-10">
                <a href="https://www.postgresql.org/" target="_blank">
                    <img
                        alt="Postgresql"
                        src="https://www.svgrepo.com/show/303301/postgresql-logo.svg"
                        width={158}
                        height={48}
                        className="max-h-32 w-full object-contain"
                    />
                </a>
            </div>
            <div className="bg-gray-400/5 p-6 sm:p-10">
                <a href='https://render.com/' target='_blank'>       
                    <img
                        alt="Render"
                        src="https://us1.discourse-cdn.com/flex016/uploads/render/original/2X/a/ad2cd49c57c27455f695b61f3f8a01571697b336.svg"
                        width={158}
                        height={48}
                        className="max-h-32 w-full object-contain"
                    />
                </a>
            </div>
          </div>
        </div>
      </div>
    )
  }