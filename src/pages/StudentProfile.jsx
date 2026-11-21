import React, { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { uploadToCloudinary } from "../utils/cloudinary";
import { DEFAULT_SETTINGS, isEnglishOnly } from "../utils/helpers";
import CountdownTimer from "../components/CountdownTimer";
import GlassDropdown from "../components/GlassDropdown";
import {
  LogOut,
  Edit3,
  Save,
  X,
  Camera,
  CheckCircle2,
  Megaphone,
  CreditCard,
  Upload,
  AlertCircle,
} from "lucide-react";

const PROGRAMME_OPTIONS = ["BA", "Private", "Master's Regular"];
const PAYMENT_METHODS = ["bKash", "Nagad", "Cash"];

export default function StudentProfile() {
  const { user, studentProfile, logout } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Farewell registration state
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bKash");
  const [accountNumber, setAccountNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submittingFarewell, setSubmittingFarewell] = useState(false);
  const [farewellSuccess, setFarewellSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "farewell"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          farewellDate: data.farewellDate || DEFAULT_SETTINGS.farewellDate,
          notice: data.notice || DEFAULT_SETTINGS.notice,
          categories:
            Array.isArray(data.categories) && data.categories.length > 0
              ? data.categories
              : DEFAULT_SETTINGS.categories,
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (settings.categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(settings.categories[0].id);
    }
  }, [settings.categories, selectedCategoryId]);

  const selectedCategory =
    settings.categories.find((c) => c.id === selectedCategoryId) ||
    settings.categories[0];

  const startEditing = () => {
    setEditForm({
      name: studentProfile.name,
      contactNumber: studentProfile.contactNumber,
      registrationNo: studentProfile.registrationNo,
      session: studentProfile.session,
      programme: studentProfile.programme || "BA",
    });
    setEditing(true);
    setError("");
  };

  const handleEditInput = (field, value) => {
    if (!isEnglishOnly(value)) {
      setError("Only English characters are allowed.");
      return;
    }
    setError("");
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    try {
      await updateDoc(doc(db, "students", user.uid), {
        ...editForm,
        updatedAt: serverTimestamp(),
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file);
      await updateDoc(doc(db, "students", user.uid), {
        photoUrl: url,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFarewellSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedCategory) return;
    if (!screenshotFile) {
      setError("Please upload your payment screenshot.");
      return;
    }

    setSubmittingFarewell(true);
    try {
      const screenshotUrl = await uploadToCloudinary(screenshotFile);
      await updateDoc(doc(db, "students", user.uid), {
        farewellRegistered: true,
        farewell: {
          categoryId: selectedCategory.id,
          categoryLabel: selectedCategory.label,
          categoryLabelEn: selectedCategory.labelEn || selectedCategory.label,
          amount: Number(selectedCategory.amount),
          paymentMethod,
          accountNumber: accountNumber.trim(),
          transactionId: transactionId.trim(),
          screenshotUrl,
          registeredAt: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      });
      setFarewellSuccess("Farewell registration submitted successfully!");
    } catch (err) {
      setError(err.message || "Failed to submit farewell registration.");
    } finally {
      setSubmittingFarewell(false);
    }
  };

  if (!studentProfile) return null;

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-700">Masters Farewell Portal</h1>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {farewellSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-sm text-emerald-800 font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{farewellSuccess}</span>
          </div>
        )}

        {/* Countdown & Notice if Registered */}
        {studentProfile.farewellRegistered && (
          <div className="space-y-4">
            <CountdownTimer targetDate={settings.farewellDate} />

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3.5">
              <Megaphone className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">
                  Farewell Notice
                </h3>
                <p className="text-amber-800 text-sm mt-1 whitespace-pre-line">
                  {settings.notice}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Profile Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={studentProfile.photoUrl}
                  alt={studentProfile.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100"
                />
                <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-md transition">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleChangePhoto}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadingPhoto && (
                <span className="text-xs text-indigo-600 mt-2">Uploading new photo...</span>
              )}

              <h2 className="text-xl font-bold text-slate-900 mt-4">
                {studentProfile.name}
              </h2>
              <p className="text-sm text-slate-500">{studentProfile.email}</p>

              {studentProfile.farewellRegistered ? (
                <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registered for Farewell
                </span>
              ) : (
                <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  Farewell Registration Pending
                </span>
              )}
            </div>

            <hr className="my-5 border-slate-200" />

            {!editing ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold">{studentProfile.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reg. No:</span>
                  <span className="font-semibold">{studentProfile.registrationNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session:</span>
                  <span className="font-semibold">{studentProfile.session}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Programme:</span>
                  <span className="font-semibold">{studentProfile.programme}</span>
                </div>

                <button
                  onClick={startEditing}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-sm transition"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 text-sm">
                <div>
                  <label className="text-xs text-slate-500">Name (English)</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => handleEditInput("name", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Contact (English)</label>
                  <input
                    type="text"
                    required
                    value={editForm.contactNumber}
                    onChange={(e) => handleEditInput("contactNumber", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Reg. No (English)</label>
                  <input
                    type="text"
                    required
                    value={editForm.registrationNo}
                    onChange={(e) => handleEditInput("registrationNo", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Session (English)</label>
                  <input
                    type="text"
                    required
                    value={editForm.session}
                    onChange={(e) => handleEditInput("session", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Programme</label>
                  <GlassDropdown
                    value={editForm.programme}
                    onChange={(val) =>
                      setEditForm((prev) => ({ ...prev, programme: val }))
                    }
                    options={PROGRAMME_OPTIONS}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Farewell Registration Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Farewell Registration & Payment
              </h2>
            </div>

            {studentProfile.farewellRegistered && studentProfile.farewell ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
                  <p className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    You are successfully registered for the Masters Farewell!
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Registered on:{" "}
                    {new Date(studentProfile.farewell.registeredAt).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-xs">Selected Category</span>
                    <span className="font-semibold text-slate-900">
                      {studentProfile.farewell.categoryLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Amount Paid</span>
                    <span className="font-bold text-indigo-700 text-base">
                      {studentProfile.farewell.amount} BDT
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Payment Method</span>
                    <span className="font-semibold">
                      {studentProfile.farewell.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Account Number</span>
                    <span className="font-semibold">
                      {studentProfile.farewell.accountNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Transaction ID</span>
                    <span className="font-semibold">
                      {studentProfile.farewell.transactionId}
                    </span>
                  </div>
                </div>

                {studentProfile.farewell.screenshotUrl && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Payment Screenshot:
                    </p>
                    <a
                      href={studentProfile.farewell.screenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={studentProfile.farewell.screenshotUrl}
                        alt="Payment Screenshot"
                        className="max-h-60 rounded-xl border border-slate-200 object-contain"
                      />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleFarewellSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Package Category *
                  </label>
                  <div className="space-y-2.5">
                    {settings.categories.map((cat) => (
                      <label
                        key={cat.id}
                        className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          selectedCategoryId === cat.id
                            ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategoryId === cat.id}
                            onChange={() => setSelectedCategoryId(cat.id)}
                            className="mt-1 accent-indigo-600"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {cat.label}
                            </p>
                            {cat.labelEn && (
                              <p className="text-xs text-slate-500 mt-0.5">{cat.labelEn}</p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 font-bold text-indigo-700 text-sm">
                          {cat.amount} ৳
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Payment Method *
                    </label>
                    <GlassDropdown
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={PAYMENT_METHODS}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Payable Amount (Auto)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${selectedCategory?.amount || 0} BDT`}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100 text-indigo-700 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder={
                        paymentMethod === "Cash"
                          ? "Cash Receiver Name / N/A"
                          : "01XXXXXXXXX"
                      }
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder={
                        paymentMethod === "Cash" ? "Receipt No / Cash" : "e.g. BKA89X23K"
                      }
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Screenshot *
                  </label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl p-4 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition text-sm text-slate-600">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    <span>
                      {screenshotFile
                        ? screenshotFile.name
                        : "Click to upload payment screenshot"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submittingFarewell}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  {submittingFarewell
                    ? "Submitting Payment..."
                    : "Complete Farewell Registration"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
