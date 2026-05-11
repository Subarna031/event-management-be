import { useState } from "react";
import PropTypes from "prop-types";
import { attendanceApi } from "../api/attendance";
import { useNotification } from "../hooks/useNotification";

// Dynamic import to avoid SSR issues with react-qr-reader
let QrReaderComponent = null;
try {
  // eslint-disable-next-line no-undef
  const mod = await import("react-qr-reader");
  QrReaderComponent = mod.QrReader || mod.default;
} catch {
  // Library not installed yet
}

export default function QRScanner({ onCheckedIn }) {
  const { notify } = useNotification();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleScan = async (result) => {
    if (!result || processing) return;
    const token = result?.text || result;
    if (token === lastResult) return;

    setLastResult(token);
    setProcessing(true);
    try {
      const { data } = await attendanceApi.checkIn(token);
      notify(`Checked in: ${data.attendee}`, "success");
      onCheckedIn?.(data);
    } catch (err) {
      const msg = err.response?.data?.error || "Check-in failed.";
      notify(msg, "error");
    } finally {
      setProcessing(false);
    }
  };

  if (!QrReaderComponent) {
    return (
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500">
        <p className="text-sm mb-2 font-medium">QR Scanner unavailable</p>
        <p className="text-xs">Install react-qr-reader to enable camera scanning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!scanning ? (
        <button onClick={() => setScanning(true)} className="btn-primary w-full">
          Start QR Scanner
        </button>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <QrReaderComponent
            onResult={handleScan}
            constraints={{ facingMode: "environment" }}
            className="w-full"
          />
          <button
            onClick={() => { setScanning(false); setLastResult(null); }}
            className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-xs shadow"
          >
            Stop
          </button>
          {processing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-medium">Processing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

QRScanner.propTypes = {
  onCheckedIn: PropTypes.func,
};
