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
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

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
    type: "",
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
  const [selectedFuelType, setSelectedFuelType] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  // Common fuel types
  const fuelTypes = [
    "Petrol 92",
    "Petrol 95",
    "Diesel",
    "Super Diesel",
    "Kerosene",
    "Auto Gas"
  ];

  // Fetch data from Firebase
  useEffect(() => {
    const fuelDataRef = ref(database, "fuel_prices");
    onValue(fuelDataRef, (snapshot) => {
      const data = snapshot.val();
      setIsLoading(false);
      if (data) {
        const dataArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
          // For price history, we'll store each update as an array
          priceHistory: value.priceHistory || [
            { price: value.price, date: new Date().toISOString() }
          ]
        }));
        setFuelData(dataArray);
      } else {
        setFuelData([]);
      }
    });
  }, []);

  // Load price history when a fuel type is selected
  useEffect(() => {
    if (selectedFuelType) {
      const selectedItem = fuelData.find(
        (item) => item.id === selectedFuelType
      );
      if (selectedItem && selectedItem.priceHistory) {
        setPriceHistory(selectedItem.priceHistory);
      }
    }
  }, [selectedFuelType, fuelData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({ type: "", price: "" });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.type || !formData.price) return;

    const priceFloat = parseFloat(formData.price);
    if (isNaN(priceFloat)) return;

    const newData = {
      type: formData.type,
      price: priceFloat.toFixed(2),
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      // Update existing record - preserve price history
      const existingItem = fuelData.find((item) => item.id === editingId);
      const updatedPriceHistory = [
        ...(existingItem.priceHistory || []),
        { price: priceFloat, date: new Date().toISOString() }
      ];

      const fuelRef = ref(database, `fuel_prices/${editingId}`);
      update(fuelRef, {
        ...newData,
        priceHistory: updatedPriceHistory
      })
        .then(() => {
          resetForm();
        })
        .catch((error) => console.error("Error updating data: ", error));
    } else {
      // Add new record with initial price history
      const fuelRef = ref(database, "fuel_prices");
      push(fuelRef, {
        ...newData,
        priceHistory: [{ price: priceFloat, date: new Date().toISOString() }]
      })
        .then(() => {
          resetForm();
        })
        .catch((error) => console.error("Error adding data: ", error));
    }
  };

  const handleEdit = (item) => {
    setFormData({
      type: item.type,
      price: item.price
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this fuel type?")) {
      const fuelRef = ref(database, `fuel_prices/${id}`);
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
      filteredData = filteredData.filter((item) =>
        item.type.toLowerCase().includes(filterText.toLowerCase())
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

  // Prepare data for bar chart
  const barChartData = {
    labels: fuelData.map((item) => item.type),
    datasets: [
      {
        label: "Current Price (Rs/L)",
        data: fuelData.map((item) => parseFloat(item.price)),
        backgroundColor: fuelData.map(
          (_, index) => `hsl(${(index * 360) / fuelData.length}, 70%, 50%)`
        ),
        borderColor: fuelData.map(
          (_, index) => `hsl(${(index * 360) / fuelData.length}, 70%, 30%)`
        ),
        borderWidth: 1
      }
    ]
  };

  // Prepare data for line chart (price history)
  const lineChartData = {
    labels: priceHistory.map((_, index) => `Update ${index + 1}`),
    datasets: [
      {
        label: "Price History (Rs/L)",
        data: priceHistory.map((item) => parseFloat(item.price)),
        fill: false,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      },
      title: {
        display: true,
        text: "Current Fuel Prices Comparison"
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "Price (Rs/L)"
        }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      },
      title: {
        display: true,
        text: selectedFuelType
          ? `Price History for ${
              fuelData.find((item) => item.id === selectedFuelType)?.type
            }`
          : "Price History"
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "Price (Rs/L)"
        }
      }
    }
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
                Fuel Prices Registry
              </h1>
              <p className="text-black/80 text-sm md:text-base">
                Track and compare fuel prices over time
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
              Add Fuel Type
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
                  {editingId ? "Edit Fuel Price" : "Add New Fuel Type"}
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
                    htmlFor="type"
                  >
                    Fuel Type
                  </label>
                  {editingId ? (
                    <input
                      type="text"
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                      readOnly
                    />
                  ) : (
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    >
                      <option value="">Select fuel type</option>
                      {fuelTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="mb-6">
                  <label
                    className="block text-gray-300 font-medium mb-2"
                    htmlFor="price"
                  >
                    Price (per liter)
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
                    {editingId ? "Update Price" : "Add Fuel Type"}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Fuel Prices Table */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-xl overflow-hidden lg:col-span-2">
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
                    Fuel Prices Registry
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
                    placeholder="Search fuel types..."
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
                    Add your first fuel type using the button below.
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
                    Add Fuel Type
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
                            onClick={() => requestSort("type")}
                          >
                            <div className="flex items-center">
                              Fuel Type
                              <span className="ml-2">
                                {getSortIndicator("type")}
                              </span>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 cursor-pointer"
                            onClick={() => requestSort("price")}
                          >
                            <div className="flex items-center">
                              Current Price
                              <span className="ml-2">
                                {getSortIndicator("price")}
                              </span>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 cursor-pointer hidden sm:table-cell"
                            onClick={() => requestSort("updatedAt")}
                          >
                            <div className="flex items-center">
                              Last Updated
                              <span className="ml-2">
                                {getSortIndicator("updatedAt")}
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
                            className={`hover:bg-slate-700/50 transition-colors duration-150 ${
                              selectedFuelType === item.id
                                ? "bg-slate-700/30"
                                : ""
                            }`}
                            onClick={() => setSelectedFuelType(item.id)}
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
                                    <path
                                      fillRule="evenodd"
                                      d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z"
                                      clipRule="evenodd"
                                    />
                                    <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                                  </svg>
                                </div>
                                {item.type}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/30 text-yellow-300">
                                Rs. {parseFloat(item.price).toFixed(2)} /L
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 hidden sm:table-cell">
                              {new Date(item.updatedAt).toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(item);
                                  }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                  }}
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
                          No fuel types match your search criteria.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Fuel Prices Comparison
              </h3>
              <div className="h-64">
                {fuelData.length > 0 ? (
                  <Bar data={barChartData} options={barChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No data available for chart
                  </div>
                )}
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedFuelType
                  ? `Price History for ${
                      fuelData.find((item) => item.id === selectedFuelType)
                        ?.type || "Selected Fuel"
                    }`
                  : "Select a fuel type to view price history"}
              </h3>
              <div className="h-64">
                {selectedFuelType && priceHistory.length > 0 ? (
                  <Line data={lineChartData} options={lineChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    {selectedFuelType
                      ? "No price history available"
                      : "Please select a fuel type from the table"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Section */}
        {fuelData.length > 0 && (
          <div className="space-y-4">
            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current Average Price Card */}
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
                      Avg. Price
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-white">
                      Rs.{" "}
                      {(
                        fuelData.reduce(
                          (sum, item) => sum + parseFloat(item.price),
                          0
                        ) / fuelData.length
                      ).toFixed(2)}
                      <span className="text-sm font-normal text-gray-400">
                        {" "}
                        /L
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Across {fuelData.length} fuel types
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Range Card */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-md p-5 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-500/20 mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Price Range
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-white">
                      Rs.{" "}
                      {Math.min(
                        ...fuelData.map((item) => parseFloat(item.price))
                      ).toFixed(2)}{" "}
                      -{" "}
                      {Math.max(
                        ...fuelData.map((item) => parseFloat(item.price))
                      ).toFixed(2)}
                      <span className="text-sm font-normal text-gray-400">
                        {" "}
                        /L
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Difference: Rs.{" "}
                      {(
                        Math.max(
                          ...fuelData.map((item) => parseFloat(item.price))
                        ) -
                        Math.min(
                          ...fuelData.map((item) => parseFloat(item.price))
                        )
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Most Recent Update Card */}
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Last Updated
                    </p>
                    {(() => {
                      const sortedByDate = [...fuelData].sort(
                        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                      );
                      const mostRecent = sortedByDate[0];
                      const date = mostRecent
                        ? new Date(mostRecent.updatedAt)
                        : null;
                      return (
                        <>
                          <p className="text-xl md:text-2xl font-bold text-white">
                            {date
                              ? date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric"
                                })
                              : "N/A"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {date
                              ? `${
                                  mostRecent.type
                                } at ${date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}`
                              : "No updates"}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Price Trend Card */}
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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      30-Day Trend
                    </p>
                    {(() => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                      const changes = fuelData
                        .map((fuel) => {
                          if (
                            fuel.priceHistory &&
                            fuel.priceHistory.length >= 2
                          ) {
                            const recent = fuel.priceHistory.slice(-1)[0];
                            const old =
                              fuel.priceHistory.find(
                                (ph) => new Date(ph.date) <= thirtyDaysAgo
                              ) || fuel.priceHistory[0];
                            if (old && recent) {
                              return (
                                ((parseFloat(recent.price) -
                                  parseFloat(old.price)) /
                                  parseFloat(old.price)) *
                                100
                              );
                            }
                          }
                          return 0;
                        })
                        .filter((change) => change !== 0);

                      const avgChange =
                        changes.length > 0
                          ? changes.reduce((sum, change) => sum + change, 0) /
                            changes.length
                          : 0;

                      const isPositive = avgChange > 0;
                      const changeText = isPositive
                        ? `+${avgChange.toFixed(1)}%`
                        : `${avgChange.toFixed(1)}%`;

                      return (
                        <>
                          <p
                            className={`text-xl md:text-2xl font-bold ${
                              isPositive ? "text-red-400" : "text-green-400"
                            }`}
                          >
                            {isPositive ? "↑" : "↓"} {changeText}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {isPositive ? "Increase" : "Decrease"} in last 30
                            days
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Most Expensive Fuel */}
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
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Most Expensive
                    </p>
                    {(() => {
                      const maxPrice = Math.max(
                        ...fuelData.map((item) => parseFloat(item.price))
                      );
                      const expensiveFuel = fuelData.find(
                        (item) => parseFloat(item.price) === maxPrice
                      );
                      return (
                        <>
                          <p className="text-xl md:text-2xl font-bold text-white">
                            {expensiveFuel?.type || "N/A"}
                          </p>
                          <p className="text-sm text-gray-400">
                            Rs. {maxPrice.toFixed(2)} /L
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Least Expensive Fuel */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl shadow-md p-5 border-l-4 border-teal-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-teal-500/20 mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-teal-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Least Expensive
                    </p>
                    {(() => {
                      const minPrice = Math.min(
                        ...fuelData.map((item) => parseFloat(item.price))
                      );
                      const cheapFuel = fuelData.find(
                        (item) => parseFloat(item.price) === minPrice
                      );
                      return (
                        <>
                          <p className="text-xl md:text-2xl font-bold text-white">
                            {cheapFuel?.type || "N/A"}
                          </p>
                          <p className="text-sm text-gray-400">
                            Rs. {minPrice.toFixed(2)} /L
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200 py-10 rounded-xl shadow-xl">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              {/* Logo and brand */}
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-amber-300 to-yellow-600 rounded-full p-3 shadow-lg transform transition-transform hover:scale-105">
                  <img
                    src="/icon.png"
                    alt="Icon"
                    className="h-9 w-9 object-contain"
                  />
                </div>

                <div>
                  <h2 className="font-bold text-2xl text-white tracking-tight">
                    TaxiMeter
                  </h2>
                  <p className="text-sm text-gray-400 font-light">
                    Fuel Price Manager
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} Fuel Price Manager
              </p>
              <a
                href="https://ishanhatharasinghe.github.io/portfolio_web/"
                target="_blank"
                rel="noopener noreferrer"
                className="group text-amber-400 hover:text-amber-300 transition duration-300 font-medium text-sm flex items-center mt-4 md:mt-0"
              >
                <span>All rights reserved Ishan Hatharasinghe </span>
                <svg
                  className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
