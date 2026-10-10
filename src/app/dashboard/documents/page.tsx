"use client";
import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  RefreshCw,
  Image as ImageIcon,
  FolderLock,
  FileCode,
  Check,
  Eye,
  X,
  Search,
} from "lucide-react";

interface DocumentItem {
  id: string;
  source_id: string;
  filename: string;
  document_type: string;
  classification: "PUBLIC" | "CONFIDENTIAL" | "RESTRICTED" | string;
  department_id?: string;
  created_at?: string;
}

interface ChunkItem {
  id: string;
  chunk_id: string;
  text: string;
  page_number: number;
}

interface PreviewState {
  isOpen: boolean;
  docId: string;
  filename: string;
  loading: boolean;
  error?: string;
  document?: DocumentItem;
  chunks?: ChunkItem[];
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [classification, setClassification] = useState<"PUBLIC" | "CONFIDENTIAL" | "RESTRICTED">("CONFIDENTIAL");
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [uploadStatus, setUploadStatus] = useState<{
    message: string;
    success: boolean;
    sample?: string;
    chunkCount?: number;
    docId?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Preview Modal State
  const [preview, setPreview] = useState<PreviewState>({
    isOpen: false,
    docId: "",
    filename: "",
    loading: false,
  });

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/documents", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadStatus(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("classification", classification);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadStatus({
          message: `Successfully ingested "${data.document.filename}"`,
          sample: data.extracted_sample,
          chunkCount: data.chunk_count,
          docId: data.document.source_id,
          success: true,
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchDocs();
      } else {
        setUploadStatus({
          message: data.detail || "Ingestion rejected by security policy",
          success: false,
        });
      }
    } catch {
      setUploadStatus({ message: "Failed to connect to ingestion pipeline", success: false });
    } finally {
      setIsUploading(false);
    }
  };

  const openPreview = async (doc: DocumentItem) => {
    setPreview({
      isOpen: true,
      docId: doc.id,
      filename: doc.filename,
      loading: true,
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${doc.id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPreview({
          isOpen: true,
          docId: doc.id,
          filename: doc.filename,
          loading: false,
          document: data.document,
          chunks: data.chunks,
        });
      } else {
        setPreview({
          isOpen: true,
          docId: doc.id,
          filename: doc.filename,
          loading: false,
          error: data.detail || "Server rejected document preview: You lack clearance.",
        });
      }
    } catch {
      setPreview({
        isOpen: true,
        docId: doc.id,
        filename: doc.filename,
        loading: false,
        error: "Failed to reach document preview authority.",
      });
    }
  };

  const filteredDocs = docs.filter((d) => {
    if (filter !== "ALL" && d.classification !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.filename.toLowerCase().includes(q) ||
        d.source_id.toLowerCase().includes(q) ||
        (d.department_id && d.department_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8 bg-[#060a12] text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white flex items-center font-mono">
              <FileText className="w-6 h-6 mr-3 text-cyan-400" /> Authorized Documents &amp; Ingestion
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Multimodal Ingest
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real PDF text extraction, image OCR registration, and cryptographic RBAC/ABAC chunk tag binding.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 bg-[#0a1020] border border-slate-800 rounded-xl text-[11px] text-slate-400 font-mono">
            <span className="text-amber-400 font-bold">Demo Mode</span>: In-Memory Index
          </span>
          <button
            onClick={fetchDocs}
            className="p-2 text-slate-400 hover:text-white bg-[#0a1020] border border-slate-800 rounded-xl transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Polished In-Page Upload Dropzone Section */}
      <div className="rounded-3xl bg-[#090f1e] border border-slate-800/90 p-6 md:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-tight font-mono">
                Ingest Real Document into Multimodal RAG
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Accepts .pdf, .txt, .md, .png, .jpg (Max: 15MB)
            </span>
          </div>

          <form onSubmit={handleUpload} className="space-y-5">
            {/* Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                  : selectedFile
                  ? "border-violet-500/50 bg-[#0c1429]"
                  : "border-slate-800 hover:border-slate-700 bg-[#070c18]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setUploadStatus(null);
                  }
                }}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{selectedFile.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Document"}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-medium mt-1">
                      Ready to parse and chunk. Click &quot;Ingest &amp; Attach Clearance&quot; below.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    Drag and drop file here, or <span className="text-cyan-400 underline">browse</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload real PDF whitepapers, corporate policies, invoices, or team memos.
                  </p>
                </div>
              )}
            </div>

            {/* Classification & Clearance Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setClassification("PUBLIC")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  classification === "PUBLIC"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950"
                    : "bg-[#070c18] border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>PUBLIC</span>
                  {classification === "PUBLIC" && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Accessible to all corporate users (Employee, HR, Finance, Admin).
                </div>
              </button>

              <button
                type="button"
                onClick={() => setClassification("CONFIDENTIAL")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  classification === "CONFIDENTIAL"
                    ? "bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-sm shadow-violet-950"
                    : "bg-[#070c18] border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>CONFIDENTIAL</span>
                  {classification === "CONFIDENTIAL" && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Restricted to your department and Administrators.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setClassification("RESTRICTED")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  classification === "RESTRICTED"
                    ? "bg-red-500/15 border-red-500/40 text-red-300 shadow-sm shadow-red-950"
                    : "bg-[#070c18] border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>RESTRICTED</span>
                  {classification === "RESTRICTED" && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Cryptographically isolated strictly to your user account.
                </div>
              </button>
            </div>

            {/* Ingestion Action & Policy Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  Chunks are tagged with metadata permissions <strong className="text-slate-200">before</strong> vector indexing.
                </span>
              </div>

              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-95 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-violet-950/40 shrink-0"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing &amp; Ingesting...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Ingest &amp; Attach Clearance</span>
                  </>
                )}
              </button>
            </div>

            {/* Ingestion Status Feedback */}
            {uploadStatus && (
              <div
                className={`p-4 rounded-xl border text-xs mt-3 ${
                  uploadStatus.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-center font-bold">
                  {uploadStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2 text-red-400 shrink-0" />
                  )}
                  <span>{uploadStatus.message}</span>
                  {uploadStatus.docId && (
                    <span className="ml-2 font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      ID: {uploadStatus.docId} ({uploadStatus.chunkCount} chunks)
                    </span>
                  )}
                </div>
                {uploadStatus.sample && (
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20 text-[11px] text-slate-300 font-mono">
                    <span className="text-slate-500 block mb-0.5">Extracted Content Preview:</span>
                    &quot;{uploadStatus.sample}&quot;
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Uploaded Documents List Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-mono">
              Authorized Document Repository ({filteredDocs.length})
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Pre-filtered by role</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="bg-[#090f1e] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-[#090f1e] rounded-xl border border-slate-800 text-xs">
              {["ALL", "PUBLIC", "CONFIDENTIAL", "RESTRICTED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg font-medium text-[10px] transition-colors ${
                    filter === f
                      ? "bg-gradient-to-r from-violet-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="p-8 text-slate-500 text-xs font-mono">
            Loading authorized documents from store...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-[#090f1e] border border-slate-800/80 rounded-2xl">
            <FolderLock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Documents in this Category</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your authenticated profile only sees documents permitted by your cryptographic role clearance.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc: DocumentItem) => {
              const isPdf = doc.filename.toLowerCase().endsWith(".pdf") || doc.document_type === "pdf";
              const isImg = doc.document_type === "image" || /\.(png|jpe?g)$/i.test(doc.filename);
              const Icon = isImg ? ImageIcon : isPdf ? FileText : FileCode;

              return (
                <div
                  key={doc.id}
                  className="bg-[#090f1e] border border-slate-800/80 p-5 rounded-2xl flex flex-col group hover:border-slate-700 transition-all shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        INDEXED
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold font-mono text-[9px] ${
                          doc.classification === "PUBLIC"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : doc.classification === "CONFIDENTIAL"
                            ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {doc.classification}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-slate-100 font-semibold mb-1 truncate text-xs" title={doc.filename}>
                    {doc.filename}
                  </h3>
                  <div className="text-[10px] text-slate-500 mb-4 font-mono flex items-center space-x-2">
                    <span>{doc.document_type.toUpperCase()}</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-bold">{doc.source_id}</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px]">
                    <span className="flex items-center text-slate-400">
                      <Lock className="w-3 h-3 mr-1 text-violet-400" />
                      Role Clearance Verified
                    </span>
                    <button
                      onClick={() => openPreview(doc)}
                      className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-mono text-[10px] font-bold bg-[#060a12] px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-500/40 transition-colors"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Server-Verified Document Preview Modal */}
      {preview.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c1429] border border-slate-800/90 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setPreview({ ...preview, isOpen: false })}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-mono truncate">
                Server-Verified Inspection: {preview.filename}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Identity clearance is evaluated dynamically on the server before content is returned.
            </p>

            {preview.loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-mono">Verifying server-side object authorization...</span>
              </div>
            ) : preview.error ? (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>AUTHORIZATION REJECTED (HTTP 403)</span>
                </div>
                <p className="text-xs leading-relaxed">{preview.error}</p>
                <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-red-500/20">
                  Security Event: IDOR attempt logged to tamper-evident audit stream. 0 content bytes released.
                </div>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div className="p-3.5 rounded-xl bg-[#070c18] border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Classification</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {preview.document?.classification}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Department</span>
                    <span className="font-mono text-slate-300">
                      {preview.document?.department_id || "ALL"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Source ID</span>
                    <span className="font-mono text-violet-400 font-bold">
                      {preview.document?.source_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Clearance Status</span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Authorized
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                    Extracted Semantic Chunks ({preview.chunks?.length || 0}):
                  </div>
                  {preview.chunks?.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#070c18] border border-slate-800/80 text-xs text-slate-200 space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="text-cyan-400 font-bold">{chunk.chunk_id}</span>
                        <span>Page {chunk.page_number}</span>
                      </div>
                      <p className="font-sans text-slate-300 text-xs leading-relaxed pt-1">
                        &quot;{chunk.text}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setPreview({ ...preview, isOpen: false })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
