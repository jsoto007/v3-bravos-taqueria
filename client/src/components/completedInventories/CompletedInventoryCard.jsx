export default function CompletedInventoryCard() {
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-tl-[2rem] rounded-t-lg rounded-b-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left font-mono divide-y-6 divide-gray-400 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2">VIN</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-200/30">
              <tr>
                <td className="px-4 py-2">1FAHP2F87HG171820</td>
                <td className="px-4 py-2">142 Audubon</td>
                <td className="px-4 py-2">James007</td>
                <td className="px-4 py-2">12.26.25</td>
              </tr>
              <tr>
                <td className="px-4 py-2">1FAHP2F87HG171820</td>
                <td className="px-4 py-2">142 Audubon</td>
                <td className="px-4 py-2">James007</td>
                <td className="px-4 py-2">12.26.25</td>
              </tr>
              <tr>
                <td className="px-4 py-2">1FAHP2F87HG171820</td>
                <td className="px-4 py-2">142 Audubon</td>
                <td className="px-4 py-2">James007</td>
                <td className="px-4 py-2">12.26.25</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    );
  }
