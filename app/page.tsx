import Link from "next/link";
import { QrCode, Scan } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <h1 className="text-4xl font-bold text-blue-600">Unity Platform</h1>
      <p className="text-xl text-white-600">
        Create forms, generate codes, and scan.
      </p>

      <div className="flex space-x-6">
        <Link
          href="/create"
          className="flex flex-col items-center justify-center w-64 h-64 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group"
        >
          <div className="p-4 bg-indigo-50 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors">
            <QrCode className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Product Data Import</h2>
          <p className="text-center text-gray-500 mt-2 px-4">
            Design a form and get your QR code
          </p>
        </Link>

        <Link
          href="/scan"
          className="flex flex-col items-center justify-center w-64 h-64 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group"
        >
          <div className="p-4 bg-green-50 rounded-full mb-4 group-hover:bg-green-100 transition-colors">
            <Scan className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Product Identification</h2>
          <p className="text-center text-gray-500 mt-2 px-4">
            Scan a code to retrieve and edit data
          </p>
        </Link>
      </div>
    </div>
  );
}
