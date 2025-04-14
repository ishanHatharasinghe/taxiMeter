import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { FcGoogle } from "react-icons/fc";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { googleProvider } from "../firebaseConfig";
import { useAuth } from "./AuthProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // email or google

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.code === "auth/user-not-found"
          ? "No account found with this email. Please sign up."
          : err.code === "auth/wrong-password"
          ? "Invalid password. Please try again."
          : err.message
      );
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-amber-500 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 relative overflow-hidden">
        {/* Taxi decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
        <div className="absolute top-2 left-0 w-full h-4 flex">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-4 ${
                i % 2 === 0 ? "bg-black" : "bg-yellow-400"
              }`}
            ></div>
          ))}
        </div>

        <div className="flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-yellow-500 mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V3H9v2H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">Login</h1>
        </div>

        {/* Login method tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-2 font-medium text-sm ${
              loginMethod === "email"
                ? "text-yellow-600 border-b-2 border-yellow-500"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setLoginMethod("google")}
            className={`flex-1 py-2 font-medium text-sm ${
              loginMethod === "google"
                ? "text-yellow-600 border-b-2 border-yellow-500"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Google
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Email/Password Login */}
        {loginMethod === "email" && (
          <form onSubmit={handleEmailLogin}>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="driver@example.com"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-gray-700 font-medium"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm text-yellow-600 hover:text-yellow-800"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        )}

        {/* Google Login */}
        {loginMethod === "google" && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-6">
              Sign in quickly and securely with your Google account
            </p>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              {loading ? "Connecting..." : "Continue with Google"}
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-gray-600 border-t border-gray-200 pt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-yellow-600 hover:text-yellow-800 font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
