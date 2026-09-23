import React from "react";
import { Zap, Trash2, CheckCheck } from "lucide-react";

interface HeaderProps {
  hasItems: boolean;
  hasCompletedItems: boolean;
  onClearAll: () => void;
  onClearCompleted: () => void;
  isConverting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasItems,
  hasCompletedItems,
  onClearAll,
  onClearCompleted,
  isConverting,
}) => {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Zap size={18} color="#fff" />
        </div>
        <span className="brand-title">FluxConvert</span>
        <div className="badge-offline">
          <span className="badge-dot"></span>
          <span>100% Offline & Local</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {hasCompletedItems && !isConverting && (
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "5px 12px" }}
            onClick={onClearCompleted}
            title="Limpar arquivos já convertidos"
          >
            <CheckCheck size={14} />
            <span>Limpar Concluídos</span>
          </button>
        )}

        {hasItems && !isConverting && (
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "5px 12px", color: "var(--error-color)" }}
            onClick={onClearAll}
            title="Remover todos os arquivos da fila"
          >
            <Trash2 size={14} />
            <span>Remover Todos</span>
          </button>
        )}
      </div>
    </header>
  );
};
