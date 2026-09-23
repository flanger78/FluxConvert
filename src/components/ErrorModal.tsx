import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { QueueItem } from "../types";

interface ErrorModalProps {
  item: QueueItem | null;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ item, onClose }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="modal-header">
            <div className="modal-icon-error">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="modal-title">Não foi possível converter este arquivo</div>
              <div className="modal-description">{item.mediaInfo.filename}</div>
            </div>
          </div>

          <button
            className="btn-remove-item"
            onClick={onClose}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          O arquivo pode estar corrompido, usar um codec não compatível ou o formato de destino escolhido não suporta as faixas de áudio/vídeo deste arquivo. O arquivo original não foi alterado.
        </p>

        {item.errorMessage && (
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                width: "100%",
                justifyContent: "space-between",
                fontSize: "0.78rem",
                padding: "8px 12px",
              }}
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              <span>Ver detalhes técnicos</span>
              {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTechnicalDetails && (
              <div className="technical-details" style={{ marginTop: "8px" }}>
                {item.errorMessage}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
