"use client";

import { useRef } from "react";
import Barcode from "react-barcode";
import { Download } from "lucide-react";

interface BarcodeGeneratorProps {
  id: string;
  format: "CODE39" | "CODE128";
  onDownload: (svg: SVGSVGElement, name: string) => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  id,
  format,
  onDownload,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = ref.current?.querySelector("svg");
    if (svg) {
      onDownload(svg, `barcode-${format}-${id}.png`);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-white w-full overflow-hidden">
      <h3 className="font-semibold text-gray-700 antialiased">
        Barcode ({format})
      </h3>
      <div
        ref={ref}
        className="bg-white p-2 rounded w-full overflow-x-auto flex justify-center"
      >
        <Barcode
          value={id.toUpperCase()}
          width={3}
          height={100}
          displayValue={false}
          format={format}
          margin={10}
          background="#ffffff"
        />
      </div>
      <p className="text-xs text-gray-400 font-mono break-all px-2">{id}</p>
      <button
        onClick={handleDownload}
        className="flex items-center px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" /> Download
      </button>
    </div>
  );
};

export default BarcodeGenerator;
