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

  const handleSave = () => {
    if (!formData) return;
    updateForm(formData.id, formData.fields);
    alert("Changes saved successfully!");
  };

  if (formData) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button
          onClick={handleReset}
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
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

          <div className="p-8 space-y-6">
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-8 bg-indigo-500 rounded-full mr-3"></span>
                Edit Form Data
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.fields.map((field) => (
                  <div key={field.id} className="group">
                    <label
                      className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 truncate"
                      title={field.label}
                    >
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        handleUpdateField(field.id, e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  Save Changes
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
        <h1 className="text-3xl font-bold text-gray-900">Scan Code</h1>
        <p className="text-gray-600">
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
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-lg border-gray-300 rounded-md py-4"
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
