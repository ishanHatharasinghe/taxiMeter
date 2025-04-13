import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const Welcome = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return null; // Or redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-amber-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-amber-600 mb-4">
          Welcome to Taxi Fuel Price Manager
        </h1>
        <p className="text-gray-600 mb-8">
          Track and manage fuel prices for taxi services efficiently
        </p>

        <div className="space-y-4">
          <Link
            to="/login"
            className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="block w-full bg-white border border-amber-500 text-amber-600 hover:bg-amber-50 font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
