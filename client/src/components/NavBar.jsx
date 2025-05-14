
export default function NavBar() {
  return (
    <nav className="bg-slate-500/10 p-4 rounded-xl">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-slate-500 text-lg font-bold">MyApp</div>
        <ul className="flex space-x-4">
          <li><a href="#" className="text-gray-700 hover:text-white">Home</a></li>
          <li><a href="#" className="text-gray-700 hover:text-white">About</a></li>
          <li><a href="#" className="text-gray-700 hover:text-white">Contact</a></li>
        </ul>
      </div>
    </nav>
  )
}
