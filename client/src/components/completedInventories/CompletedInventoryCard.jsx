
  
  export default function CompletedInventoryCard() {
    return (
        <div className="bg-grey-800 w-full bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-tl-[2rem] rounded-t-lg rounded-b-xl">
            <table className="w-full text-left ml-4 mt-6">
                <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Country</th>
                </tr>
                <tr>
                <td>Alfreds Futterkiste</td>
                <td>Maria Anders</td>
                <td>Germany</td>
                </tr>
                <tr>
                <td>Centro comercial Moctezuma</td>
                <td>Francisco Chang</td>
                <td>Mexico</td>
                </tr>
            </table>
        </div>
    )
  }
  
