import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { uploadToCloudinary } from "../utils/cloudinary";
import { DEFAULT_SETTINGS, imageUrlToBase64 } from "../utils/helpers";
import CountdownTimer from "../components/CountdownTimer";
import GlassDropdown from "../components/GlassDropdown";
import {
  LogOut,
  Users,
  Settings,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
  Edit3,
  Plus,
  X,
  ExternalLink,
  Save,
} from "lucide-react";

const PROGRAMME_OPTIONS = ["BA", "Private", "Master's Regular"];
const PAYMENT_METHODS = ["bKash", "Nagad", "Cash"];
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "registered", label: "Farewell Registered" },
  { value: "unregistered", label: "Profile Only" },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [students, setStudents] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Export loading
  const [exportingPdf, setExportingPdf] = useState(false);

  // Edit Modal State
  const [editStudent, setEditStudent] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(list);
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "farewell"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const merged = {
          farewellDate: data.farewellDate || DEFAULT_SETTINGS.farewellDate,
          notice: data.notice || DEFAULT_SETTINGS.notice,
          categories:
            Array.isArray(data.categories) && data.categories.length > 0
              ? data.categories
              : DEFAULT_SETTINGS.categories,
        };
        setSettings(merged);
        setSettingsForm(merged);
      } else {
        setDoc(doc(db, "settings", "farewell"), DEFAULT_SETTINGS);
      }
    });

    return () => {
      unsubStudents();
      unsubSettings();
    };
  }, []);

  const categoryFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "All Categories" },
      ...settings.categories.map((c) => ({
        value: c.id,
        label: `${c.labelEn || c.label} (${c.amount} BDT)`,
      })),
    ];
  }, [settings.categories]);

  const editCategoryOptions = useMemo(() => {
    return settings.categories.map((c) => ({
      value: c.id,
      label: `${c.label} (${c.amount} BDT)`,
    }));
  }, [settings.categories]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    settings.categories.forEach((c) => {
      counts[c.id] = 0;
    });
    students.forEach((s) => {
      if (s.farewellRegistered && s.farewell?.categoryId) {
        counts[s.farewell.categoryId] = (counts[s.farewell.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [students, settings.categories]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.registrationNo?.toLowerCase().includes(q) ||
        s.contactNumber?.toLowerCase().includes(q) ||
        s.farewell?.transactionId?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "registered" && s.farewellRegistered) ||
        (statusFilter === "unregistered" && !s.farewellRegistered);

      const matchesCategory =
        categoryFilter === "all" ||
        (s.farewellRegistered && s.farewell?.categoryId === categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [students, search, statusFilter, categoryFilter]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    await deleteDoc(doc(db, "students", id));
  };

  const openEditModal = (s) => {
    setEditStudent({
      ...s,
      programme: s.programme || "BA",
      farewell: s.farewell
        ? { ...s.farewell }
        : {
            categoryId: settings.categories[0]?.id || "",
            categoryLabel: settings.categories[0]?.label || "",
            categoryLabelEn: settings.categories[0]?.labelEn || "",
            amount: settings.categories[0]?.amount || 0,
            paymentMethod: "bKash",
            accountNumber: "",
            transactionId: "",
            screenshotUrl: "",
          },
    });
    setNewPhotoFile(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      let photoUrl = editStudent.photoUrl;
      if (newPhotoFile) {
        photoUrl = await uploadToCloudinary(newPhotoFile);
      }

      const payload = {
        name: editStudent.name,
        email: editStudent.email,
        contactNumber: editStudent.contactNumber,
        registrationNo: editStudent.registrationNo,
        session: editStudent.session,
        programme: editStudent.programme,
        photoUrl,
        farewellRegistered: Boolean(editStudent.farewellRegistered),
        farewell: editStudent.farewellRegistered ? editStudent.farewell : null,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "students", editStudent.id), payload);
      setEditStudent(null);
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const exportExcel = () => {
    const rows = filteredStudents.map((s, i) => ({
      SL: i + 1,
      Name: s.name || "",
      Email: s.email || "",
      Contact: s.contactNumber || "",
      "Registration No": s.registrationNo || "",
      Session: s.session || "",
      Programme: s.programme || "",
      "Farewell Status": s.farewellRegistered ? "Registered" : "Pending",
      Category: s.farewell?.categoryLabelEn || s.farewell?.categoryLabel || "-",
      "Amount (BDT)": s.farewell?.amount || 0,
      "Payment Method": s.farewell?.paymentMethod || "-",
      "Account Number": s.farewell?.accountNumber || "-",
      "Transaction ID": s.farewell?.transactionId || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `Masters_Farewell_Users_${Date.now()}.xlsx`);
  };

  const exportPDF = async () => {
    setExportingPdf(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.setFontSize(16);
      pdf.text("Masters Farewell - Registered Students Report", 14, 15);
      pdf.setFontSize(10);
      pdf.text(
        `Generated: ${new Date().toLocaleString("en-US")} | Total Records: ${filteredStudents.length}`,
        14,
        21
      );

      const imageMap = {};
      await Promise.all(
        filteredStudents.map(async (s) => {
          imageMap[s.id] = await imageUrlToBase64(s.photoUrl);
        })
      );

      const tableBody = filteredStudents.map((s, idx) => [
        idx + 1,
        "",
        s.name || "",
        `${s.registrationNo || ""}\n(${s.session || ""})`,
        s.programme || "",
        `${s.contactNumber || ""}\n${s.email || ""}`,
        s.farewellRegistered
          ? s.farewell?.categoryLabelEn || "Registered"
          : "Not Registered",
        s.farewellRegistered
          ? `${s.farewell?.amount || 0} BDT\n${s.farewell?.paymentMethod || ""}\nTrx: ${
              s.farewell?.transactionId || "-"
            }`
          : "-",
      ]);

      autoTable(pdf, {
        startY: 26,
        head: [
          [
            "SL",
            "Photo",
            "Name",
            "Reg No & Session",
            "Programme",
            "Contact & Email",
            "Category",
            "Payment Info",
          ],
        ],
        body: tableBody,
        styles: { fontSize: 8, valign: "middle", minCellHeight: 18 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 18 },
          2: { cellWidth: 35 },
          3: { cellWidth: 32 },
          4: { cellWidth: 25 },
          5: { cellWidth: 48 },
          6: { cellWidth: 52 },
          7: { cellWidth: 45 },
        },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 1) {
            const student = filteredStudents[data.row.index];
            const base64 = imageMap[student.id];
            if (base64) {
              const imgSize = 14;
              const x = data.cell.x + (data.cell.width - imgSize) / 2;
              const y = data.cell.y + (data.cell.height - imgSize) / 2;
              pdf.addImage(base64, "JPEG", x, y, imgSize, imgSize);
            }
          }
        },
      });

      pdf.save(`Masters_Farewell_Report_${Date.now()}.pdf`);
    } catch (err) {
      alert("PDF export error: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  const addCategory = () => {
    setSettingsForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          id: `cat_${Date.now()}`,
          label: "নতুন ক্যাটাগরি",
          labelEn: "New Category",
          amount: 1000,
        },
      ],
    }));
  };

  const updateCategoryField = (id, field, value) => {
    setSettingsForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, [field]: field === "amount" ? Number(value) : value } : c
      ),
    }));
  };

  const removeCategory = (id) => {
    setSettingsForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      await setDoc(doc(db, "settings", "farewell"), settingsForm);
      setSettingsMsg("Settings updated! Countdown, Notice & Categories are now live.");
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Top Bar */}
      <header className="bg-indigo-950 text-white sticky top-0 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
            <div className="flex bg-indigo-900 rounded-lg p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  activeTab === "users" ? "bg-indigo-600 text-white" : "text-indigo-200"
                }`}
              >
                <Users className="w-4 h-4" /> Students ({students.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  activeTab === "settings" ? "bg-indigo-600 text-white" : "text-indigo-200"
                }`}
              >
                <Settings className="w-4 h-4" /> Farewell Settings
              </button>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-red-600 px-3 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {activeTab === "users" ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Total Profiles / Farewell Registered
                </p>
                <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                  {students.length} /{" "}
                  <span className="text-emerald-600">
                    {students.filter((s) => s.farewellRegistered).length}
                  </span>
                </p>
              </div>

              {settings.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <p
                    className="text-xs font-semibold text-slate-500 line-clamp-1"
                    title={cat.label}
                  >
                    {cat.label}
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {categoryCounts[cat.id] || 0}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      {cat.amount} BDT
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter & Export Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, reg no, phone, email, TrxID..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <GlassDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={STATUS_FILTER_OPTIONS}
                  className="min-w-[175px]"
                />

                <GlassDropdown
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryFilterOptions}
                  className="min-w-[230px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel (No Img)
                </button>
                <button
                  onClick={exportPDF}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  {exportingPdf ? "Generating PDF..." : "PDF (With Img)"}
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Academic Info</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Farewell & Payment</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.photoUrl}
                              alt={s.name}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-xs space-y-0.5">
                          <p>
                            <span className="text-slate-500">Reg:</span>{" "}
                            <span className="font-semibold">{s.registrationNo}</span>
                          </p>
                          <p>
                            <span className="text-slate-500">Session:</span> {s.session}
                          </p>
                          <p>
                            <span className="text-slate-500">Prog:</span>{" "}
                            <span className="font-semibold text-indigo-700">
                              {s.programme}
                            </span>
                          </p>
                        </td>
                        <td className="p-3.5 text-xs font-medium">{s.contactNumber}</td>
                        <td className="p-3.5 text-xs">
                          {s.farewellRegistered && s.farewell ? (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                {s.farewell.amount} BDT ({s.farewell.paymentMethod})
                              </span>
                              <p className="text-slate-700 font-medium max-w-xs">
                                {s.farewell.categoryLabel}
                              </p>
                              <p className="text-slate-500">
                                Acc: {s.farewell.accountNumber} | Trx:{" "}
                                {s.farewell.transactionId}
                              </p>
                              {s.farewell.screenshotUrl && (
                                <a
                                  href={s.farewell.screenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
                                >
                                  View Screenshot <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                              Not Registered
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                              title="Edit User"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.name)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No students found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Settings Tab */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Farewell Notice, Date & Categories
              </h2>

              {settingsMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                  {settingsMsg}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Farewell Date & Time (Live Countdown Target)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={settingsForm.farewellDate}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        farewellDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Farewell Notice (Shown on Registered Student Profile)
                  </label>
                  <textarea
                    rows={4}
                    value={settingsForm.notice}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, notice: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Farewell Categories & Amounts
                    </label>
                    <button
                      type="button"
                      onClick={addCategory}
                      className="flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Category
                    </button>
                  </div>

                  <div className="space-y-3">
                    {settingsForm.categories.map((cat, index) => (
                      <div
                        key={cat.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">
                            Category #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCategory(cat.id)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) =>
                            updateCategoryField(cat.id, "label", e.target.value)
                          }
                          placeholder="Display Title (Bangla / English)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={cat.labelEn || ""}
                            onChange={(e) =>
                              updateCategoryField(cat.id, "labelEn", e.target.value)
                            }
                            placeholder="English Title (For PDF)"
                            className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                          />
                          <input
                            type="number"
                            value={cat.amount}
                            onChange={(e) =>
                              updateCategoryField(cat.id, "amount", e.target.value)
                            }
                            placeholder="Amount (BDT)"
                            className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white font-semibold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? "Saving Settings..." : "Save All Settings"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-1 space-y-4">
              <CountdownTimer targetDate={settingsForm.farewellDate} />
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs text-slate-600">
                Live preview of the student countdown timer. Changing the date above updates
                every registered student's dashboard immediately.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Student Data</h3>
              <button
                onClick={() => setEditStudent(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-sm">
              <div className="flex items-center gap-4">
                <img
                  src={
                    newPhotoFile
                      ? URL.createObjectURL(newPhotoFile)
                      : editStudent.photoUrl
                  }
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <label className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg cursor-pointer">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Name</label>
                  <input
                    type="text"
                    required
                    value={editStudent.name}
                    onChange={(e) =>
                      setEditStudent({ ...editStudent, name: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Contact</label>
                  <input
                    type="text"
                    required
                    value={editStudent.contactNumber}
                    onChange={(e) =>
                      setEditStudent({ ...editStudent, contactNumber: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Registration No</label>
                  <input
                    type="text"
                    required
                    value={editStudent.registrationNo}
                    onChange={(e) =>
                      setEditStudent({ ...editStudent, registrationNo: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Session</label>
                  <input
                    type="text"
                    required
                    value={editStudent.session}
                    onChange={(e) =>
                      setEditStudent({ ...editStudent, session: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-500 mb-1 block">Programme</label>
                  <GlassDropdown
                    value={editStudent.programme}
                    onChange={(val) =>
                      setEditStudent({ ...editStudent, programme: val })
                    }
                    options={PROGRAMME_OPTIONS}
                  />
                </div>
              </div>

              <hr className="my-2" />

              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(editStudent.farewellRegistered)}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      farewellRegistered: e.target.checked,
                    })
                  }
                  className="accent-indigo-600"
                />
                Farewell Registered
              </label>

              {editStudent.farewellRegistered && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Payment Category
                    </label>
                    <GlassDropdown
                      value={editStudent.farewell?.categoryId || ""}
                      onChange={(catId) => {
                        const cat = settings.categories.find((c) => c.id === catId);
                        if (!cat) return;
                        setEditStudent({
                          ...editStudent,
                          farewell: {
                            ...editStudent.farewell,
                            categoryId: cat.id,
                            categoryLabel: cat.label,
                            categoryLabelEn: cat.labelEn || cat.label,
                            amount: Number(cat.amount),
                          },
                        });
                      }}
                      options={editCategoryOptions}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">
                        Payment Method
                      </label>
                      <GlassDropdown
                        value={editStudent.farewell?.paymentMethod || "bKash"}
                        onChange={(val) =>
                          setEditStudent({
                            ...editStudent,
                            farewell: {
                              ...editStudent.farewell,
                              paymentMethod: val,
                            },
                          })
                        }
                        options={PAYMENT_METHODS}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Amount (BDT)</label>
                      <input
                        type="number"
                        value={editStudent.farewell?.amount || 0}
                        onChange={(e) =>
                          setEditStudent({
                            ...editStudent,
                            farewell: {
                              ...editStudent.farewell,
                              amount: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full mt-1 px-3 py-2.5 rounded-2xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Account Number</label>
                      <input
                        type="text"
                        value={editStudent.farewell?.accountNumber || ""}
                        onChange={(e) =>
                          setEditStudent({
                            ...editStudent,
                            farewell: {
                              ...editStudent.farewell,
                              accountNumber: e.target.value,
                            },
                          })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Transaction ID</label>
                      <input
                        type="text"
                        value={editStudent.farewell?.transactionId || ""}
                        onChange={(e) =>
                          setEditStudent({
                            ...editStudent,
                            farewell: {
                              ...editStudent.farewell,
                              transactionId: e.target.value,
                            },
                          })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
