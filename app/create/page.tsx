"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, Trash2, Save, Download, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { saveForm, FormField } from "@/utils/storage";
import QRCodeGenerator from "@/components/generators/QRCodeGenerator";
import BarcodeGenerator from "@/components/generators/BarcodeGenerator";

const BulkResultItem = ({
  item,
  downloadImage,
  selectedFormats,
}: {
  item: { id: string; qrUrl?: string };
  downloadImage: (url: string, name: string) => void;
  selectedFormats: { qr: boolean; code39: boolean; code128: boolean };
}) => {
  // Helper for barcode download bridging
  const downloadBarcode = (svg: SVGSVGElement, name: string) => {
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL("image/png");
      downloadImage(pngFile, name);
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="border p-6 rounded-lg flex flex-col items-center space-y-6 bg-gray-50 shadow-sm animate-fade-in w-full">
      <div className="flex items-center justify-between w-full border-b pb-2">
        <span className="font-mono font-bold text-xl text-gray-700">
          {item.id}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-12 w-full">
        {/* 2D Codes */}
        {selectedFormats.qr && item.qrUrl && (
          <QRCodeGenerator
            url={item.qrUrl}
            id={item.id}
            onDownload={downloadImage}
          />
        )}

        {/* 1D Barcodes */}
        {selectedFormats.code39 && (
          <BarcodeGenerator
            id={item.id}
            format="CODE39"
            onDownload={downloadBarcode}
          />
        )}
        {selectedFormats.code128 && (
          <BarcodeGenerator
            id={item.id}
            format="CODE128"
            onDownload={downloadBarcode}
          />
        )}
      </div>
    </div>
  );
};

export default function CreatePage() {
  const [fields, setFields] = useState<FormField[]>([
    { id: uuidv4(), label: "Item Name", value: "" },
    { id: uuidv4(), label: "Price", value: "" },
    {
      id: uuidv4(),
      label: "Date Added",
      value: new Date().toISOString().split("T")[0],
    },
    { id: uuidv4(), label: "Description", value: "" },
    { id: uuidv4(), label: "Manufacturer", value: "" },
    { id: uuidv4(), label: "Weight", value: "" },
    { id: uuidv4(), label: "Count", value: "" },
  ]);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [bulkForms, setBulkForms] = useState<{ id: string; qrUrl?: string }[]>(
    [],
  );
  // Format Selection State (Multi-select)
  const [selectedFormats, setSelectedFormats] = useState({
    qr: true,
    code39: true,
    code128: false,
  });

  // CSV Data State (Deferred Generation)
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: string[][];
    filename: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handleAddField = () => {
    setFields([...fields, { id: uuidv4(), label: "", value: "" }]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleFieldChange = (
    id: string,
    key: "label" | "value",
    text: string,
  ) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: text } : f)));
  };

  const handleFormatChange = (key: keyof typeof selectedFormats) => {
    setSelectedFormats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* CSV Handling - Read File Only */
  const handleDownloadTemplate = () => {
    const headers = [
      "Item Name",
      "Price",
      "Date Added",
      "Description",
      "Manufacturer",
      "Weight",
      "Count",
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "bulk_upload_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        alert("CSV must have a header row and at least one data row.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines
        .slice(1)
        .map((line) => line.split(",").map((v) => v.trim()));

      setCsvData({ headers, rows, filename: file.name });
      // Clear manual fields if CSV is loaded? Or just keep them hidden/inactive.
      // We will render a different UI state when csvData is present.
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkReset = () => {
    setBulkForms([]);
    setCsvData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* Unified Save & Generate Handler */
  const handleSaveAndGenerate = async () => {
    // 1. Check if we are in CSV mode
    if (csvData) {
      await generateBulkForms();
      return;
    }

    // 2. Manual Mode Validation
    if (fields.some((f) => !f.label.trim())) {
      alert("Please fill in labels for all fields");
      return;
    }

    // 3. Generate Single Form
    const savedForm = saveForm(fields);
    setGeneratedId(savedForm.id);

    // Generate QR if enabled
    if (selectedFormats.qr) {
      try {
        const url = await QRCode.toDataURL(savedForm.id);
        setQrCodeUrl(url);
      } catch (err) {
        console.error(err);
      }
    } else {
      setQrCodeUrl("");
    }
  };

  const generateBulkForms = async () => {
    if (!csvData) return;

    const generatedResults: { id: string; qrUrl?: string }[] = [];
    const { headers, rows } = csvData;

    for (const rowValues of rows) {
      const rowFields: FormField[] = headers.map((header, index) => ({
        id: uuidv4(),
        label: header,
        value: rowValues[index] || "",
      }));

      const savedForm = saveForm(rowFields);

      let url: string | undefined = undefined;
      if (selectedFormats.qr) {
        try {
          url = await QRCode.toDataURL(savedForm.id);
        } catch (err) {
          console.error("QR Generation failed for " + savedForm.id, err);
        }
      }
      generatedResults.push({ id: savedForm.id, qrUrl: url });
    }

    setBulkForms(generatedResults);
    // Keep csvData for reference or clear it?
    // Usually better to clear or show results view.
    // The current UI shows results if bulkForms.length > 0
  };

  const handleReset = () => {
    setGeneratedId(null);
    setFields([
      { id: uuidv4(), label: "Item Name", value: "" },
      { id: uuidv4(), label: "Price", value: "" },
      {
        id: uuidv4(),
        label: "Date Added",
        value: new Date().toISOString().split("T")[0],
      },
      { id: uuidv4(), label: "Description", value: "" },
      { id: uuidv4(), label: "Manufacturer", value: "" },
      { id: uuidv4(), label: "Weight", value: "" },
      { id: uuidv4(), label: "Count", value: "" },
    ]);
    setQrCodeUrl("");
    setCsvData(null);
  };

  const downloadImage = (source: string, name: string) => {
    const link = document.createElement("a");
    link.href = source;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBarcode = (format: string = "CODE39") => {
    // This function needs to know WHICH barcode to download if multiple are shown.
    // For single view, we might show multiple barcodes now.
    // We will update the render logic to use IDs or refs for specific barcodes.
    // For now, let's assume the ref points to the container of the clicked barcode button's sibling.
    // Actually, distinct refs are needed if we render multiple barcodes.
    // Simpler approach: Pass the ref or ID to a specific downloader helper, or just query selector based on ID.
    // For the Single View 'download' button, we will update inline.
  };

  // Helper to download SVG barcode as PNG
  const downloadBarcodeFromSvg = (
    svgElement: SVGSVGElement,
    filename: string,
  ) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL("image/png");
      downloadImage(pngFile, filename);
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // 1. Bulk Forms Results View
  if (bulkForms.length > 0) {
    return (
      <div className="w-full px-4 space-y-8 animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Bulk Creation Results
              </h2>
            </div>
            <button
              onClick={handleBulkReset}
              className="flex items-center px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </button>
          </div>

          <p className="text-gray-500">
            Successfully created {bulkForms.length} forms.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {bulkForms.map((item) => (
              <BulkResultItem
                key={item.id}
                item={item}
                downloadImage={downloadImage}
                selectedFormats={selectedFormats}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Single Result View (Generated)
  if (generatedId) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <Save className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Form Saved!</h2>
          <p className="text-gray-500">
            Your data has been stored securely in your browser.
          </p>

          <div className="grid grid-cols-1 gap-8 pt-6">
            {/* Display All Selected Formats */}
            {selectedFormats.qr && qrCodeUrl && (
              <QRCodeGenerator
                url={qrCodeUrl}
                id={generatedId}
                onDownload={downloadImage}
              />
            )}

            {selectedFormats.code39 && (
              <BarcodeGenerator
                id={generatedId}
                format="CODE39"
                onDownload={downloadBarcodeFromSvg}
              />
            )}
            {selectedFormats.code128 && (
              <BarcodeGenerator
                id={generatedId}
                format="CODE128"
                onDownload={downloadBarcodeFromSvg}
              />
            )}
          </div>

          <div className="pt-8">
            <button
              onClick={handleReset}
              className="flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Create Another Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default Create Form View
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="px-6 py-8 sm:p-10 bg-indigo-600">
          <h2 className="text-2xl font-extrabold text-white">
            Product Data
          </h2>
          <p className="mt-2 text-indigo-200">
            Add fields or upload CSV to store information and generate codes.
          </p>
        </div>

        <div className="px-6 py-8 sm:p-10 space-y-6">
          {/* CSV Upload Section */}
          <div
            className={`p-6 border-2 border-dashed rounded-lg flex flex-col items-center text-center space-y-4 transition-colors ${csvData ? "border-green-400 bg-green-50" : "border-indigo-200 bg-indigo-50"}`}
          >
            <p className="text-sm text-indigo-800 font-medium">
              Bulk import from CSV
            </p>

            {!csvData ? (
              <>
                <p className="text-xs text-indigo-600">
                  Upload a CSV file. First row must be headers (Field Names).
                </p>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row gap-4 items-center mt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    Select CSV File
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    Download Template
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <span className="flex items-center text-green-700 font-bold">
                  <Save className="w-4 h-4 mr-2" /> CSV Loaded:{" "}
                  {csvData.filename}
                </span>
                <p className="text-xs text-green-600">
                  {csvData.rows.length} rows ready to process.
                </p>
                <button
                  onClick={() => setCsvData(null)}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Remove CSV
                </button>
              </div>
            )}
          </div>

          {!csvData && (
            <>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">
                  Or create manually
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-start group">
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field Name
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          handleFieldChange(field.id, "label", e.target.value)
                        }
                        placeholder="e.g. Model Number"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      />
                    </div>
                    <div className="flex-[2] space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Default Value
                      </label>
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          handleFieldChange(field.id, "value", e.target.value)
                        }
                        placeholder="Enter value"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="mt-6 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      disabled={fields.length === 1}
                      title="Remove Field"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col space-y-6 pt-6 border-t border-gray-100">
            {/* Format Selection (Grouped) */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Formats to Generate
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1D Barcodes Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase">
                    1D Barcodes
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFormats.code39}
                        onChange={() => handleFormatChange("code39")}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="font-medium text-gray-700">Code 39</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFormats.code128}
                        onChange={() => handleFormatChange("code128")}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="font-medium text-gray-700">
                        Code 128
                      </span>
                    </label>
                  </div>
                </div>

                {/* 2D Codes Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase">
                    2D Codes
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFormats.qr}
                        onChange={() => handleFormatChange("qr")}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="font-medium text-gray-700">QR Code</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {!csvData && (
                <button
                  onClick={handleAddField}
                  className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </button>
              )}
              <div className={csvData ? "ml-auto" : ""}>
                {/* Logic: if CSV mode, Add Field is hidden, so button should be right aligned. If manual, it's space-between. This works. */}
                <button
                  onClick={handleSaveAndGenerate}
                  className={`flex items-center px-3 py-2 text-base font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105 active:scale-95 ${!selectedFormats.qr && !selectedFormats.code39 && !selectedFormats.code128 ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={
                    !selectedFormats.qr &&
                    !selectedFormats.code39 &&
                    !selectedFormats.code128
                  }
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save & Generate Results
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for single barcode display
