import Link from "next/link";
import { QrCode, Scan } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center cursor-pointer"
            >
              <span className="font-bold text-xl text-indigo-600">
                Unity Platform
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/create"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Product Data Import
              </Link>
              <Link
                href="/scan"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
              >
                <Scan className="w-4 h-4 mr-2" />
                Product Identification
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
