import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function GlassDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-sm text-left transition-all duration-200 bg-white/75 backdrop-blur-md border shadow-sm ${
          open
            ? "border-indigo-500 ring-2 ring-indigo-500/30"
            : "border-slate-300/80 hover:border-indigo-400"
        }`}
      >
        <span className="truncate font-medium text-slate-800">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl ring-1 ring-slate-900/10 p-1.5 max-h-60 overflow-y-auto">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm text-left transition-all duration-150 ${
                  isSelected
                    ? "bg-indigo-600/90 text-white font-semibold shadow-sm"
                    : "text-slate-700 hover:bg-indigo-50/90 hover:text-indigo-700"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
