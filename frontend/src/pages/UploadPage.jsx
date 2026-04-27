import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, FileSpreadsheet, FileIcon, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadFile } from "../services/api";

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, uploading, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file) => {
    const validTypes = [
      "text/csv", 
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/pdf"
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|pdf)$/i)) {
      setStatus("error");
      setErrorMsg("Please upload a valid CSV, Excel, or PDF file.");
      setFile(null);
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
      setStatus("error");
      setErrorMsg("File size must be below 50MB.");
      setFile(null);
      return;
    }

    setFile(file);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setStatus("uploading");
    
    try {
      const result = await uploadFile(file);
      setStatus("success");
      setResultMsg(result.message || "File uploaded and processed successfully.");
      
      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "An error occurred during upload.");
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileIcon size={32} className="text-slate-400" />;
    if (file.name.endsWith(".csv")) return <FileText size={32} className="text-emerald-500" />;
    if (file.name.match(/\.(xlsx|xls)$/i)) return <FileSpreadsheet size={32} className="text-emerald-600" />;
    if (file.name.endsWith(".pdf")) return <FileIcon size={32} className="text-rose-500" />;
    return <FileIcon size={32} className="text-brand-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Upload Data</h1>
        <p className="text-sm text-slate-500 mt-1">Upload your transactional data to run the ML segmentation pipeline.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-12 text-center relative overflow-hidden">
        
        {/* Upload Zone */}
        {status !== "uploading" && status !== "success" ? (
          <div>
            <div 
              className={`border-2 border-dashed rounded-xl p-10 transition-colors ${
                isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-400 hover:bg-slate-50"
              } cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".csv, .xlsx, .xls, .pdf"
              />
              
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <UploadCloud size={28} className="text-slate-500" />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Click or drag file to this area</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  <FileText size={14} className="text-emerald-500" /> CSV
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  <FileSpreadsheet size={14} className="text-emerald-600" /> Excel
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  <FileIcon size={14} className="text-rose-500" /> PDF
                </div>
              </div>
            </div>

            {/* Selected File Preview */}
            {file && (
              <div className="mt-6 flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-lg animate-fade-in relative z-10">
                <div className="flex items-center gap-4">
                  {getFileIcon()}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setFile(null); setStatus("idle"); }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={handleUpload}
                    className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Process Data
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : status === "uploading" ? (
          <div className="py-16 flex flex-col items-center justify-center animate-fade-in">
            <Loader2 size={48} className="text-brand-500 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Processing Data Pipeline...</h3>
            <p className="text-sm text-slate-500 max-w-md">Running RFM extraction, StandardScaler, PCA dimensionality reduction, and K-Means clustering.</p>
            <div className="w-64 h-2 bg-slate-100 rounded-full mt-8 overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-brand-500 rounded-full animate-[progress_2s_ease-in-out_infinite] w-1/2"></div>
            </div>
            <style>{`@keyframes progress { 0% { left: -50%; } 100% { left: 150%; } }`}</style>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Upload Complete</h3>
            <p className="text-sm text-slate-500 mb-8">{resultMsg}</p>
            <p className="text-xs font-semibold text-brand-600 bg-brand-50 px-4 py-2 rounded-full animate-pulse">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {status === "error" && (
          <div className="mt-6 flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-left animate-fade-in">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold">Upload Failed</h4>
              <p className="text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Expected CSV Format</h3>
        <p className="text-xs text-slate-500 mb-4">
          The ML pipeline requires raw transactional data with the following columns:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">InvoiceNo</th>
                <th className="p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">InvoiceDate</th>
                <th className="p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">CustomerID</th>
                <th className="p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Description</th>
                <th className="p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Quantity</th>
                <th className="p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">UnitPrice</th>
                <th className="p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Country</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">536365</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">2023-12-01 08:26:00</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">17850</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">WHITE HANGING HEART T-LIGHT HOLDER</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">6</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">2.55</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">United Kingdom</td>
              </tr>
              <tr>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">536366</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">2023-12-01 08:28:00</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">12583</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">PACK OF 72 RETROSPOT CAKE CASES</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">12</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">1.25</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">United Kingdom</td>
              </tr>
              <tr>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">536367</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">2023-12-01 09:15:00</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">14892</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">JUMBO BAG RED RETROSPOT</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">24</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">1.95</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">France</td>
              </tr>
              <tr>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">536368</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">2023-12-01 10:05:00</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">15632</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">LUNCH BAG RED RETROSPOT</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">8</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">1.65</td>
                <td className="p-3 text-xs font-mono text-slate-500 border-b border-slate-100">Germany</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
