import React from "react";
import { Folder, FolderOpen, Check } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

interface DestinationPickerProps {
  mode: "same_as_input" | "custom";
  setMode: (m: "same_as_input" | "custom") => void;
  customFolder: string;
  setCustomFolder: (folder: string) => void;
  defaultFolderLocation?: string;
  disabled: boolean;
}

export const DestinationPicker: React.FC<DestinationPickerProps> = ({
  mode,
  setMode,
  customFolder,
  setCustomFolder,
  defaultFolderLocation,
  disabled,
}) => {
  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Escolha a pasta de destino para salvar os arquivos convertidos",
      });

      if (selected && typeof selected === "string") {
        setCustomFolder(selected);
        setMode("custom");
      }
    } catch (err) {
      console.error("Erro ao selecionar diretório de destino:", err);
    }
  };

  return (
    <div className="settings-card destination-section">
      <div className="card-title">
        <Folder size={14} />
        <span>Pasta de Saída</span>
      </div>

      <div className="radio-group">
        <label className="radio-item">
          <input
            type="radio"
            name="destination_mode"
            checked={mode === "same_as_input"}
            onChange={() => setMode("same_as_input")}
            disabled={disabled}
          />
          <div>
            <div>Salvar na mesma pasta do arquivo original</div>
            {defaultFolderLocation && (
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Pasta padrão: <code style={{ color: "#a5b4fc" }}>{defaultFolderLocation}</code>
              </div>
            )}
          </div>
        </label>

        <label className="radio-item">
          <input
            type="radio"
            name="destination_mode"
            checked={mode === "custom"}
            onChange={() => {
              setMode("custom");
              if (!customFolder) {
                handleSelectFolder();
              }
            }}
            disabled={disabled}
          />
          <span>Salvar em outra pasta específica</span>
        </label>
      </div>

      {mode === "custom" && (
        <div className="custom-folder-row">
          <div
            className="folder-path-display"
            title={customFolder || "Nenhuma pasta selecionada"}
            style={{
              borderColor: customFolder ? "var(--border-highlight)" : "var(--border-subtle)",
              color: customFolder ? "#fff" : "var(--text-muted)",
            }}
          >
            {customFolder ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Check size={13} color="var(--success-color)" />
                <span>{customFolder}</span>
              </div>
            ) : (
              "Nenhuma pasta selecionada. Clique ao lado para escolher..."
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "6px 12px", whiteSpace: "nowrap" }}
            onClick={handleSelectFolder}
            disabled={disabled}
          >
            <FolderOpen size={13} />
            <span>{customFolder ? "Alterar Pasta" : "Escolher Pasta..."}</span>
          </button>
        </div>
      )}
    </div>
  );
};
