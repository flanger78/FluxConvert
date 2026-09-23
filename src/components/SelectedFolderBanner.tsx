import React from "react";
import { Folder, FolderOpen, X } from "lucide-react";
import { FolderInfo } from "../types";

interface SelectedFolderBannerProps {
  folder: FolderInfo;
  onChangeFolder: () => void;
  onClearFolder: () => void;
  isConverting: boolean;
}

export const SelectedFolderBanner: React.FC<SelectedFolderBannerProps> = ({
  folder,
  onChangeFolder,
  onClearFolder,
  isConverting,
}) => {
  return (
    <div className="selected-folder-banner">
      <div className="folder-banner-left">
        <div className="folder-banner-icon">
          <Folder size={22} />
        </div>
        <div className="folder-banner-info">
          <div className="folder-banner-title">
            <span className="folder-tag">PASTA SELECIONADA</span>
            <span className="folder-name">{folder.name}</span>
          </div>
          <div className="folder-banner-path" title={folder.path}>
            <span>{folder.path}</span>
            <span className="folder-badge-count">
              {folder.count} {folder.count === 1 ? "arquivo de mídia" : "arquivos de mídia"}
            </span>
          </div>
        </div>
      </div>

      {!isConverting && (
        <div className="folder-banner-actions">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.76rem", padding: "6px 12px" }}
            onClick={onChangeFolder}
            title="Escolher outra pasta no disco"
          >
            <FolderOpen size={13} />
            <span>Trocar Pasta</span>
          </button>
          <button
            type="button"
            className="btn-remove-item"
            style={{ padding: "6px" }}
            onClick={onClearFolder}
            title="Remover pasta selecionada"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
