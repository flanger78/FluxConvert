import React from "react";
import {
  Music,
  Video,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  HardDrive,
  Loader2,
} from "lucide-react";
import { QueueItem } from "../types";

interface FileListProps {
  items: QueueItem[];
  onRemoveItem: (id: string) => void;
  onShowError: (item: QueueItem) => void;
  isConverting: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  onRemoveItem,
  onShowError,
  isConverting,
}) => {
  return (
    <div className="file-list-card">
      <div className="file-list-header">
        <span className="file-list-count">
          Fila de Conversão ({items.length}{" "}
          {items.length === 1 ? "arquivo" : "arquivos"})
        </span>
      </div>

      <div className="file-items">
        {items.map((item) => {
          const isVideo = item.mediaInfo.has_video;
          const originalExt = item.mediaInfo.extension.toUpperCase();
          const targetExt = item.targetFormat.toUpperCase();

          return (
            <div key={item.id} className="file-item">
              <div
                className={`file-type-icon ${
                  isVideo ? "file-type-video" : "file-type-audio"
                }`}
                title={isVideo ? "Arquivo de Vídeo" : "Arquivo de Áudio"}
              >
                {isVideo ? <Video size={18} /> : <Music size={18} />}
              </div>

              <div className="file-details">
                <div className="file-name" title={item.mediaInfo.filename}>
                  {item.mediaInfo.filename}
                </div>

                <div className="file-meta">
                  <span className="file-meta-tag">{originalExt}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <HardDrive size={11} />
                    <span>{item.mediaInfo.formatted_size}</span>
                  </div>

                  {item.mediaInfo.duration_seconds > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} />
                      <span>{item.mediaInfo.formatted_duration}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--accent-primary)",
                      fontWeight: 600,
                    }}
                  >
                    <ArrowRight size={11} />
                    <span>{targetExt}</span>
                  </div>
                </div>

                {item.status === "converting" && (
                  <div style={{ marginTop: "6px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.72rem",
                        color: "var(--text-secondary)",
                        marginBottom: "3px",
                      }}
                    >
                      <span>Progresso individual</span>
                      <span>{Math.round(item.progress)}%</span>
                    </div>
                    <div className="progress-track" style={{ height: "4px" }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {item.status === "idle" && (
                  <span className="file-status-badge status-idle">Pendente</span>
                )}

                {item.status === "converting" && (
                  <span className="file-status-badge status-converting">
                    <Loader2 size={12} className="spin" />
                    <span>Convertendo</span>
                  </span>
                )}

                {item.status === "completed" && (
                  <span className="file-status-badge status-completed">
                    <CheckCircle2 size={13} />
                    <span>Concluído</span>
                  </span>
                )}

                {item.status === "error" && (
                  <span
                    className="file-status-badge status-error"
                    onClick={() => onShowError(item)}
                    title="Clique para ver detalhes do erro"
                  >
                    <AlertCircle size={13} />
                    <span>Erro</span>
                  </span>
                )}

                {item.status === "cancelled" && (
                  <span className="file-status-badge status-idle">Cancelado</span>
                )}

                {!isConverting && (
                  <button
                    className="btn-remove-item"
                    onClick={() => onRemoveItem(item.id)}
                    title="Remover este arquivo"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
