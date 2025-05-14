
export default function CarsCart() {
    return (
        <div className="bg-gray-100 dark:bg-gray-900">

            <div className="card w-96 shadow-md rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                <figure>
                    <img
                        className="rounded-xl w-full object-cover h-48"
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/2019_Toyota_Corolla_Icon_Tech_VVT-i_Hybrid_1.8.jpg/960px-2019_Toyota_Corolla_Icon_Tech_VVT-i_Hybrid_1.8.jpg"
                        alt="Car"
                    />
                </figure>
                <div className="card-body px-6 py-4">
                    <h2 className="card-title text-xl font-semibold mb-2">2076 Toyota Camry</h2>
                    <p className="text-gray-700 dark:text-gray-300">
                        A card component has a figure, a body part, and inside body there are title and actions parts
                    </p>
                    <div className="card-actions justify-end mt-4">
                        {/* Action buttons can go here */}
                    </div>
                </div>
            </div>
        </div>
    );
}