export default function CompletedInventoryCard() {
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-tl-[2rem] rounded-t-lg rounded-b-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Accounted</th>
                <th className="px-4 py-2">Unaccounted</th>
                <th className="px-4 py-2">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2">Alfreds Futterkiste</td>
                <td className="px-4 py-2">Maria Anders</td>
                <td className="px-4 py-2">Germany</td>
                <td className="px-4 py-2">Germany</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Centro comercial Moctezuma</td>
                <td className="px-4 py-2">Francisco Chang</td>
                <td className="px-4 py-2">Mexico</td>
                <td className="px-4 py-2">Boolean</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
