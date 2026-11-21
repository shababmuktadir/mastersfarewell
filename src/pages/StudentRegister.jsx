import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { uploadToCloudinary } from "../utils/cloudinary";
import { isEnglishOnly } from "../utils/helpers";
import GlassDropdown from "../components/GlassDropdown";
import { Upload, LogOut, AlertCircle, UserCheck } from "lucide-react";

const PROGRAMME_OPTIONS = ["BA", "Private", "Master's Regular"];

export default function StudentRegister() {
  const { user, logout } = useAuth();

  const [form, setForm] = useState({
    name: user?.displayName && isEnglishOnly(user.displayName) ? user.displayName : "",
    email: user?.email || "",
    contactNumber: "",
    registrationNo: "",
    session: "",
    programme: "BA",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || "");
  const [englishWarning, setEnglishWarning] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEnglishChange = (field, value) => {
    if (!isEnglishOnly(value)) {
      setEnglishWarning("Only English characters are allowed! Bangla input is blocked.");
      return;
    }
    setEnglishWarning("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    for (const key of ["name", "email", "contactNumber", "registrationNo", "session"]) {
      if (!isEnglishOnly(form[key])) {
        setError("All fields must be filled in English only.");
        return;
      }
    }

    if (!photoFile && !photoPreview) {
      setError("Please upload your profile photo.");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = photoPreview;
      if (photoFile) {
        photoUrl = await uploadToCloudinary(photoFile);
      }

      await setDoc(doc(db, "students", user.uid), {
        uid: user.uid,
        name: form.name.trim(),
        email: form.email.trim(),
        contactNumber: form.contactNumber.trim(),
        registrationNo: form.registrationNo.trim(),
        session: form.session.trim(),
        programme: form.programme,
        photoUrl,
        farewellRegistered: false,
        farewell: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message || "Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-lg overflow-visible">
        <div className="bg-indigo-600 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
          <div>
            <h1 className="text-xl font-bold">Student Registration</h1>
            <p className="text-xs text-indigo-100 mt-0.5">
              Complete your profile once (English only)
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {englishWarning && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{englishWarning}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 bg-slate-100 flex items-center justify-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">
              Upload Profile Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name (English) *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleEnglishChange("name", e.target.value)}
              placeholder="e.g. Muktadir Sabab"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email (English) *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => handleEnglishChange("email", e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Number (English) *
              </label>
              <input
                type="text"
                required
                value={form.contactNumber}
                onChange={(e) => handleEnglishChange("contactNumber", e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Registration No (English) *
              </label>
              <input
                type="text"
                required
                value={form.registrationNo}
                onChange={(e) => handleEnglishChange("registrationNo", e.target.value)}
                placeholder="e.g. 1920102030"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Session (English) *
              </label>
              <input
                type="text"
                required
                value={form.session}
                onChange={(e) => handleEnglishChange("session", e.target.value)}
                placeholder="e.g. 2021-2022"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Programme *
              </label>
              <GlassDropdown
                value={form.programme}
                onChange={(val) => setForm((prev) => ({ ...prev, programme: val }))}
                options={PROGRAMME_OPTIONS}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            {submitting ? "Submitting Registration..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
