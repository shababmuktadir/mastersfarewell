import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, ADMIN_EMAIL, ADMIN_UID } from "../firebase";
import { GraduationCap, ShieldCheck, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [role, setRole] = useState("student"); // "student" | "admin"
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdminEmailMatched =
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleStudentAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        throw new Error("Admin email cannot be used in Student Portal. Switch to Admin Login.");
      }
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user.uid === ADMIN_UID) {
        await signOut(auth);
        setError("Please use the Admin Login tab for admin access.");
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!isAdminEmailMatched) return;

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.uid !== ADMIN_UID) {
        await signOut(auth);
        setError("Unauthorized! Your UID does not match the authorized Admin account.");
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-7 text-center text-white">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Masters Farewell Portal</h1>
          <p className="text-indigo-100 text-sm mt-1">
            Sign in to register and manage your farewell participation
          </p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 m-6 mb-2 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setError("");
              setEmail("");
              setPassword("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
              role === "student"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setError("");
              setEmail("");
              setPassword("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
              role === "admin"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin
          </button>
        </div>

        <div className="p-6 pt-4">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {role === "student" ? (
            <>
              <form onSubmit={handleStudentAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  {loading
                    ? "Please wait..."
                    : isSignUp
                    ? "Sign Up as Student"
                    : "Login as Student"}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-sm text-slate-700 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-sm text-slate-600 mt-5">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  {isSignUp ? "Login" : "Sign Up"}
                </button>
              </p>
            </>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                Restricted Area: Only the authorized Admin email and UID can sign in.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter authorized admin email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                {email && !isAdminEmailMatched && (
                  <p className="text-xs text-red-600 mt-1">
                    Email does not match authorized admin email. Login button is disabled.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isAdminEmailMatched || loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying Admin..." : "Login as Admin"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
