import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  update
} from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDppOVQHX3WrnBw08dUVsvt4ar8UerJUds",
  authDomain: "taxi-meter-web-application.firebaseapp.com",
  databaseURL:
    "https://taxi-meter-web-application-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taxi-meter-web-application",
  storageBucket: "taxi-meter-web-application.firebasestorage.app",
  messagingSenderId: "763561933041",
  appId: "1:763561933041:web:c75a764048c251cd435150",
  measurementId: "G-PMT2EJ7W61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function App() {
  const [fuelData, setFuelData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    price: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending"
  });
  const [filterText, setFilterText] = useState("");

  // Fetch data from Firebase
  useEffect(() => {
    const fuelDataRef = ref(database, "fuel_data");
    onValue(fuelDataRef, (snapshot) => {
      const data = snapshot.val();
      setIsLoading(false);
      if (data) {
        const dataArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));
        setFuelData(dataArray);
      } else {
        setFuelData([]);
      }
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", price: "" });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.price) return;

    if (editingId) {
      // Update existing record
      const fuelRef = ref(database, `fuel_data/${editingId}`);
      update(fuelRef, formData)
        .then(() => {
          resetForm();
        })
        .catch((error) => console.error("Error updating data: ", error));
    } else {
      // Add new record
      const fuelRef = ref(database, "fuel_data");
      push(fuelRef, formData)
        .then(() => {
          resetForm();
        })
        .catch((error) => console.error("Error adding data: ", error));
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      address: item.address,
      price: item.price
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const fuelRef = ref(database, `fuel_data/${id}`);
      remove(fuelRef).catch((error) =>
        console.error("Error deleting data: ", error)
      );
    }
  };

  // Sort function
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply sort and filter
  const sortedAndFilteredData = () => {
    let filteredData = [...fuelData];

    if (filterText) {
      filteredData = filteredData.filter(
        (item) =>
          item.name.toLowerCase().includes(filterText.toLowerCase()) ||
          item.address.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Taxi Fuel Price Manager</h1>
            <p className="text-white/80 mt-1">
              Track and manage fuel prices for taxi services
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-amber-600 hover:bg-amber-50 px-5 py-2 rounded-lg font-medium flex items-center shadow-md transition duration-200 transform hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Fuel Station
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingId ? "Edit Fuel Station" : "Add New Fuel Station"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="name"
                  >
                    Station Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter station name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="address"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter station address"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="price"
                  >
                    Fuel Price (per liter)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">Rs.</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0.00"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">/L</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                  >
                    {editingId ? "Update Station" : "Add Station"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
              Fuel Price Dashboard
            </h2>

            {/* Search bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search stations..."
                className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : fuelData.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-amber-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No fuel data available
              </h3>
              <p className="text-gray-600 mb-4">
                Add your first fuel station using the button above.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Fuel Station
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => requestSort("name")}
                      >
                        <div className="flex items-center">
                          Station Name
                          <span className="ml-2">
                            {getSortIndicator("name")}
                          </span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => requestSort("address")}
                      >
                        <div className="flex items-center">
                          Address
                          <span className="ml-2">
                            {getSortIndicator("address")}
                          </span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => requestSort("price")}
                      >
                        <div className="flex items-center">
                          Fuel Price
                          <span className="ml-2">
                            {getSortIndicator("price")}
                          </span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedAndFilteredData().map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-amber-50 transition-colors duration-150"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-amber-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path
                                  fillRule="evenodd"
                                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            {item.name}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                          {item.address}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Rs. {parseFloat(item.price).toFixed(2)} /L
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-amber-600 hover:text-amber-900 font-medium mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty search results */}
                {filterText && sortedAndFilteredData().length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-gray-500">
                      No stations match your search criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        {fuelData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Average Price Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Average Price
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rs.{" "}
                    {(
                      fuelData.reduce(
                        (sum, item) => sum + parseFloat(item.price),
                        0
                      ) / fuelData.length
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lowest Price Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Lowest Price
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rs.{" "}
                    {Math.min(
                      ...fuelData.map((item) => parseFloat(item.price))
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Highest Price Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Highest Price
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rs.{" "}
                    {Math.max(
                      ...fuelData.map((item) => parseFloat(item.price))
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Stations Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-amber-100 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Stations
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {fuelData.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bottom-0 bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>Taxi Fuel Price Manager © {new Date().getFullYear()}</p>
          <p className="text-gray-400 text-sm mt-2">
            An efficient way to manage fuel prices for taxi services
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
