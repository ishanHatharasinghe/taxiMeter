import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import "./index.css";
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

function Dashboard({ handleLogout }) {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black py-4 lg:py-6 shadow-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="mr-4 hidden sm:block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="14" width="7" height="7" rx="1" />
                <rect x="16" y="14" width="7" height="7" rx="1" />
                <rect x="7" y="10" width="10" height="4" rx="1" />
                <circle cx="8.5" cy="17.5" r="1.5" />
                <circle cx="19.5" cy="17.5" r="1.5" />
                <path d="M2 5h20" />
                <path d="M12 5V3" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                TaxiMeter Fuel Manager
              </h1>
              <p className="text-black/80 text-sm md:text-base">
                Track and optimize your fleet's fuel expenses
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-yellow-400 hover:bg-gray-800 px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-md transition duration-200"
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
              Add Station
            </button>
            <button
              onClick={handleLogout}
              className="bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-md transition duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 2.414L15.586 9H12V5.414zM4 4h5v4a1 1 0 001 1h5v7H4V4z"
                  clipRule="evenodd"
                />
                <path
                  d="M16 18h-5v-1h5v1zm0-3H9v1h7v-1zm-7-8l-4 4 4 4v-8z"
                  fill="currentColor"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? "Edit Fuel Station" : "Add New Fuel Station"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white"
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
                    className="block text-gray-300 font-medium mb-2"
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
                    className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter station name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-300 font-medium mb-2"
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
                    className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter station address"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label
                    className="block text-gray-300 font-medium mb-2"
                    htmlFor="price"
                  >
                    Fuel Price (per liter)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">Rs.</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full pl-12 pr-12 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="0.00"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">/L</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-lg transition duration-200"
                  >
                    {editingId ? "Update Station" : "Add Station"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Fuel Stations Registry
                </h2>
              </div>

              {/* Search bar */}
              <div className="relative w-full md:w-auto">
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
                  className="pl-10 pr-4 py-2 w-full md:w-64 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
              </div>
            ) : fuelData.length === 0 ? (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-yellow-400"
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
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No fuel data available
                </h3>
                <p className="text-gray-400 mb-6">
                  Add your first fuel station using the button below.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition duration-200"
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
                <div className="inline-block min-w-full align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-slate-600">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 cursor-pointer"
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
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 cursor-pointer hidden md:table-cell"
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
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 cursor-pointer"
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
                          className="px-3 py-3.5 text-right text-sm font-semibold text-gray-300"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {sortedAndFilteredData().map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-700/50 transition-colors duration-150"
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-yellow-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                  <path
                                    fillRule="evenodd"
                                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              {item.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-400 md:hidden">
                              {item.address}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 hidden md:table-cell">
                            {item.address}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/30 text-yellow-300">
                              Rs. {parseFloat(item.price).toFixed(2)} /L
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 p-1.5 rounded-lg transition-all"
                                title="Edit"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-lg transition-all"
                                title="Delete"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Empty search results */}
                  {filterText && sortedAndFilteredData().length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-gray-400">
                        No stations match your search criteria.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination placeholder - could be implemented in future */}
          {fuelData.length > 0 && (
            <div className="border-t border-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <a
                  href="#"
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-400 bg-slate-700/50 hover:bg-slate-700"
                >
                  Previous
                </a>
                <a
                  href="#"
                  className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-400 bg-slate-700/50 hover:bg-slate-700"
                >
                  Next
                </a>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing{" "}
                    <span className="font-medium">
                      {sortedAndFilteredData().length}
                    </span>{" "}
                    of <span className="font-medium">{fuelData.length}</span>{" "}
                    stations
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <a
                      href="#"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700/50 text-sm font-medium text-gray-400 hover:bg-slate-700"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="relative inline-flex items-center px-4 py-2 border border-slate-600 bg-yellow-500/20 text-sm font-medium text-yellow-300 hover:bg-yellow-500/30"
                    >
                      1
                    </a>
                    <a
                      href="#"
                      className="relative inline-flex items-center px-4 py-2 border border-slate-600 bg-slate-700/50 text-sm font-medium text-gray-400 hover:bg-slate-700"
                    >
                      2
                    </a>
                    <a
                      href="#"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700/50 text-sm font-medium text-gray-400 hover:bg-slate-700"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        {fuelData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Average Price Card */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500/20 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-400"
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
                  <p className="text-sm font-medium text-gray-400">
                    Average Price
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-white">
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
            <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-md p-5 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-400"
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
                  <p className="text-sm font-medium text-gray-400">
                    Lowest Price
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    Rs.{" "}
                    {Math.min(
                      ...fuelData.map((item) => parseFloat(item.price))
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Highest Price Card */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-md p-5 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-500/20 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-400"
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
                  <p className="text-sm font-medium text-gray-400">
                    Highest Price
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    Rs.{" "}
                    {Math.max(
                      ...fuelData.map((item) => parseFloat(item.price))
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Stations Card */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-md p-5 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-400"
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
                  <p className="text-sm font-medium text-gray-400">
                    Total Stations
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {fuelData.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-400 text-sm py-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-yellow-400">TaxiMeter</span>
            <span>Fuel Price Manager</span>
          </div>
          <p>
            © {new Date().getFullYear()} TaxiMeter Services. All rights
            reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
