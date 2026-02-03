"use client";

import { useState, useRef, useEffect } from "react";
import { getForm, updateForm, FormData } from "@/utils/storage";
import {
  Save,
  Scan,
  AlertCircle,
  ArrowLeft,
  Search,
  Keyboard,
  Download,
} from "lucide-react";

export default function ScanPage() {
  const [inputCode, setInputCode] = useState("");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    if (!formData && inputRef.current) {
      inputRef.current.focus();
    }
  }, [formData]);

  const handleScanSuccess = (code: string) => {
    if (!code.trim()) return;

    // Clean the code if necessary (sometimes scanners add invisible chars)
    const cleanCode = code.trim();
    const foundForm = getForm(cleanCode);

    if (foundForm) {
      setFormData(foundForm);
      setError(null);
      setInputCode("");
    } else {
      setError(`No form found with ID: ${cleanCode}`);
      // Clear input to allow invalid scan to be retried easily
      setInputCode("");
      // Using a timeout to refocus might be helpful if focus was lost
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScanSuccess(inputCode);
  };

  const handleReset = () => {
    setInputCode("");
    setFormData(null);
    setError(null);
  };

  const handleUpdateField = (fieldId: string, value: string) => {
    if (!formData) return;
    const updatedFields = formData.fields.map((f) =>
      f.id === fieldId ? { ...f, value } : f,
    );
    setFormData({ ...formData, fields: updatedFields });
  };

  const handleRecommendationChange = (value: string) => {
    if (!formData) return;
    setFormData({ ...formData, recommendation: value });
  };

  const handleSave = () => {
    if (!formData) return;
    updateForm(formData.id, formData.fields, formData.recommendation);
    alert("Changes saved successfully!");
  };

  const handleExportCSV = () => {
    if (!formData) return;

    // Filter out fields that have no label to prevent empty headers/misalignment
    const validFields = formData.fields.filter(
      (f) => f.label && f.label.trim() !== "",
    );

    const headers = [
      "ID",
      "Created At",
      "Updated At",
      "Recommendation",
      ...validFields.map((f) => f.label),
    ];

    // Ensure values map 1:1 with headers
    const values = [
      formData.id,
      new Date(formData.createdAt).toLocaleString(),
      new Date(formData.updatedAt).toLocaleString(),
      formData.recommendation || "", // Explicit empty string if undefined
      ...validFields.map((f) => f.value),
    ];

    // Helper to escape CSV values (handle commas/newlines in data)
    const escapeCsv = (val: string) => {
      if (val === null || val === undefined) return "";
      const stringVal = String(val);
      if (
        stringVal.includes(",") ||
        stringVal.includes("\n") ||
        stringVal.includes('"')
      ) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.map(escapeCsv).join(","), values.map(escapeCsv).join(",")].join(
        "\n",
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `form_${formData.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (formData) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button
          onClick={handleReset}
          className="mb-6 flex items-center text-white hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scanner
        </button>

        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="p-6 bg-green-600 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Edit Form Data</h2>
              <p className="text-green-100 text-sm mt-1">ID: {formData.id}</p>
            </div>
            <Scan className="w-8 h-8 text-green-200" />
          </div>

          <div className="p-8 space-y-8">
            {/* Row 1: Recommendation Section */}
            <div className="bg-white p-6 rounded-lg border-2 border-indigo-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                What is the next recommended process path for users?
              </h3>
              <div className="relative">
                <select
                  value={formData.recommendation || ""}
                  onChange={(e) => handleRecommendationChange(e.target.value)}
                  className="block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm cursor-pointer hover:border-indigo-300 transition-colors text-gray-900"
                >
                  <option value="">Select Recommendation...</option>
                  <option value="refurbish">Refurbish</option>
                  <option value="parts_harvest">Parts Harvest</option>
                  <option value="scrap">Scrap</option>
                </select>
              </div>
            </div>

            {/* Row 2: Data Display */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-8 bg-indigo-500 rounded-full mr-3"></span>
                Item Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formData.fields.map((field) => (
                  <div key={field.id} className="group">
                    <label
                      className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 truncate"
                      title={field.label}
                    >
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      readOnly
                      className="block w-full px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-600 bg-gray-100 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                    />
                  </div>
                ))}
                {/* Display Recommendation in Details Grid as Read-Only Confirmation */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 truncate">
                    Recommendation (Saved)
                  </label>
                  <div className="block w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm text-gray-700 font-medium">
                    {formData.recommendation
                      ? formData.recommendation.charAt(0).toUpperCase() +
                        formData.recommendation.slice(1).replace("_", " ")
                      : "-"}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end pt-6 border-t border-gray-50">
                <button
                  onClick={handleSave}
                  className="flex items-center px-3 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={handleExportCSV}
                  className="ml-4 flex items-center px-3 py-2 bg-white text-indigo-600 font-bold rounded-lg shadow-lg border border-indigo-200 hover:bg-indigo-50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">Scan Code</h1>
        <p className="text-white">
          Use your barcode scanner or enter the ID manually below.
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="mx-auto flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
          <Keyboard className="w-8 h-8 text-indigo-600" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="scan-input" className="sr-only">
              Scan Input
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Scan className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                id="scan-input"
                className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-lg border-gray-300 rounded-md py-4 font-mono bg-white text-green-400 placeholder-gray-600 tracking-wider"
                placeholder="Click here and scan..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Search className="w-4 h-4 mr-2" />
            Lookup ID
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-md flex items-start animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-400">
        <p>
          Physical scanners act as keyboards. Ensure the input box is focused.
        </p>
      </div>
    </div>
  );
}
