import React from "react";
import { Play, Square, FolderOpen, CheckCircle } from "lucide-react";

interface ActionBarProps {
  hasItems: boolean;
  isConverting: boolean;
  currentIndex: number;
  totalFiles: number;
  currentFileName: string;
  overallPercent: number;
  completedCount: number;
  errorCount: number;
  onStartConversion: () => void;
  onCancelConversion: () => void;
  onOpenFolder: () => void;
  lastOutputLocation?: string;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  hasItems,
  isConverting,
  currentIndex,
  totalFiles,
  currentFileName,
  overallPercent,
  completedCount,
  errorCount,
  onStartConversion,
  onCancelConversion,
  onOpenFolder,
  lastOutputLocation,
}) => {
  const isFinished = !isConverting && completedCount > 0 && completedCount + errorCount === totalFiles;

  return (
    <div className="action-bar">
      {isConverting && (
        <div className="progress-container">
          <div className="progress-header">
            <span style={{ color: "var(--text-primary)" }}>
              Convertendo {currentIndex + 1} de {totalFiles}
              {currentFileName ? ` — ${currentFileName}` : ""}
            </span>
            <span style={{ color: "var(--accent-primary)" }}>
              {Math.round(overallPercent)}%
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, overallPercent))}%` }}
            />
          </div>
        </div>
      )}

      {isFinished && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--success-bg)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            padding: "10px 16px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle size={18} color="var(--success-color)" />
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>
              {completedCount}{" "}
              {completedCount === 1 ? "arquivo convertido" : "arquivos convertidos"}{" "}
              com sucesso!
            </span>
            {errorCount > 0 && (
              <span style={{ fontSize: "0.8rem", color: "var(--error-color)" }}>
                ({errorCount} com erro)
              </span>
            )}
          </div>

          {lastOutputLocation && (
            <button
              className="btn btn-success"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
              onClick={onOpenFolder}
            >
              <FolderOpen size={14} />
              <span>ABRIR PASTA</span>
            </button>
          )}
        </div>
      )}

      <div className="action-buttons-row">
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {isConverting ? (
            <button className="btn btn-cancel" onClick={onCancelConversion}>
              <Square size={14} fill="currentColor" />
              <span>Cancelar conversão</span>
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!hasItems}
              onClick={onStartConversion}
            >
              <Play size={16} fill="currentColor" />
              <span>CONVERTER</span>
            </button>
          )}
        </div>

        {lastOutputLocation && !isFinished && !isConverting && (
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.82rem", padding: "8px 14px" }}
            onClick={onOpenFolder}
          >
            <FolderOpen size={14} />
            <span>Abrir pasta</span>
          </button>
        )}
      </div>
    </div>
  );
};
