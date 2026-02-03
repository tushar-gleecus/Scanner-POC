import { Download } from "lucide-react";

interface QRCodeGeneratorProps {
  url: string;
  id: string;
  onDownload: (url: string, name: string) => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  url,
  id,
  onDownload,
}) => {
  if (!url) return null;

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold text-gray-700">QR Code</h3>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <img src={url} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
      </div>
      <button
        onClick={() => onDownload(url, `qr-${id}.png`)}
        className="flex items-center px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" /> Download QR
      </button>
    </div>
  );
};

export default QRCodeGenerator;
