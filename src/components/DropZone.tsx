import React from "react";
import { UploadCloud, FolderPlus, FilePlus, Sparkles, Loader2, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";

export interface DropFileEntry {
  id: string;
  name: string;
  path?: string;
  status: "processando" | "adicionado" | "erro" | "ignorado";
}

interface DropZoneProps {
  compact?: boolean;
  onSelectFiles: () => void;
  onSelectFolder: () => void;
  isDragOver: boolean;
  setIsDragOver: (over: boolean) => void;
  onDropPaths: (paths: string[]) => void;
  processingDrop?: boolean;
  dropFiles?: DropFileEntry[];
  onRemoveDropFile?: (id: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  compact = false,
  onSelectFiles,
  onSelectFolder,
  isDragOver,
  setIsDragOver,
  onDropPaths,
  processingDrop = false,
  dropFiles = [],
  onRemoveDropFile,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // No navegador web puro (fallback), podemos capturar arquivos se houver
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const f = e.dataTransfer.files[i];
        // Se estiver rodando no Tauri ou Electron, a propriedade path existe
        const path = (f as any).path || f.name;
        if (path) paths.push(path);
      }
      if (paths.length > 0) {
        onDropPaths(paths);
      }
    }
  };

  if (compact) {
    return (
      <div
        className={`dropzone dropzone-compact ${isDragOver ? "active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onSelectFiles}
        title="Clique para adicionar mais arquivos ou arraste-os aqui"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <UploadCloud size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                Arraste mais arquivos aqui
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                ou clique para selecionar novos arquivos ou pastas
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "6px 12px" }}
              onClick={onSelectFiles}
            >
              <FilePlus size={14} />
              <span>Adicionar Arquivos</span>
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "6px 12px" }}
              onClick={onSelectFolder}
            >
              <FolderPlus size={14} />
              <span>Selecionar Pasta</span>
            </button>
          </div>
        </div>

        {processingDrop && dropFiles.length > 0 && (
          <div
            className="drop-file-list"
            style={{ marginTop: "12px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "2px" }}>
              Arquivos carregados ({dropFiles.length})
            </div>
            {dropFiles.map((f) => (
              <div key={f.id} className="drop-file-item">
                {f.status === "processando" && <Loader2 size={14} className="spin" />}
                {f.status === "adicionado" && <CheckCircle2 size={14} style={{ color: "var(--success-color)" }} />}
                {f.status === "erro" && <AlertCircle size={14} style={{ color: "var(--error-color)" }} />}
                {f.status === "ignorado" && <FileText size={14} style={{ color: "var(--text-muted)" }} />}
                <span className="drop-file-name" title={f.name}>
                  {f.name}
                </span>
                <span className="drop-file-status">
                  {f.status === "processando" && "Processando..."}
                  {f.status === "adicionado" && "Adicionado"}
                  {f.status === "erro" && "Erro"}
                  {f.status === "ignorado" && "Ignorado"}
                </span>
                {onRemoveDropFile && (
                  <button
                    className="btn-remove-item"
                    style={{ padding: "3px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDropFile(f.id);
                    }}
                    title="Remover este arquivo"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`dropzone dropzone-empty ${isDragOver ? "active" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onSelectFiles}
    >
      <div className="dropzone-icon-wrapper">
        <UploadCloud size={32} />
      </div>

      <div className="dropzone-title">ARRASTE SEUS ARQUIVOS AQUI</div>
      <div className="dropzone-subtitle">ou clique para selecionar arquivos</div>

      <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-primary" onClick={onSelectFiles}>
          <FilePlus size={16} />
          <span>Selecionar Arquivos</span>
        </button>

        <button className="btn btn-secondary" onClick={onSelectFolder}>
          <FolderPlus size={16} />
          <span>Selecionar Pasta</span>
        </button>
      </div>

      {processingDrop && dropFiles.length > 0 && (
        <div
          className="drop-file-list"
          style={{ marginTop: "20px", width: "100%", maxWidth: "440px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
            Arquivos carregados ({dropFiles.length}):
          </div>
          {dropFiles.map((f) => (
            <div key={f.id} className="drop-file-item">
              {f.status === "processando" && <Loader2 size={14} className="spin" />}
              {f.status === "adicionado" && <CheckCircle2 size={14} style={{ color: "var(--success-color)" }} />}
              {f.status === "erro" && <AlertCircle size={14} style={{ color: "var(--error-color)" }} />}
              {f.status === "ignorado" && <FileText size={14} style={{ color: "var(--text-muted)" }} />}
              <span className="drop-file-name" title={f.name}>
                {f.name}
              </span>
              <span className="drop-file-status">
                {f.status === "processando" && "Processando..."}
                {f.status === "adicionado" && "Adicionado"}
                {f.status === "erro" && "Erro"}
                {f.status === "ignorado" && "Ignorado"}
              </span>
              {onRemoveDropFile && (
                <button
                  className="btn-remove-item"
                  style={{ padding: "3px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDropFile(f.id);
                  }}
                  title="Remover este arquivo"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.74rem",
          color: "var(--text-muted)",
        }}
      >
        <Sparkles size={13} color="#6366f1" />
        <span>Suporta WAV, MP3, FLAC, M4A, AAC, MOV, MP4, MKV, WebM e muito mais</span>
      </div>
    </div>
  );
};
