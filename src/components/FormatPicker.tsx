import React from "react";
import { Music, Video, Headphones } from "lucide-react";

interface FormatPickerProps {
  hasVideoInQueue: boolean;
  hasAudioInQueue: boolean;
  activeCategory: "audio" | "video";
  setActiveCategory: (cat: "audio" | "video") => void;
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  extractAudioOnly: boolean;
  setExtractAudioOnly: (val: boolean) => void;
}

const AUDIO_FORMATS = [
  { id: "mp3", label: "MP3", desc: "Universal e compatível" },
  { id: "wav", label: "WAV", desc: "Sem compressão / Studio" },
  { id: "flac", label: "FLAC", desc: "Lossless de alta fidelidade" },
  { id: "m4a", label: "M4A / AAC", desc: "Padrão Apple e streaming" },
  { id: "ogg", label: "OGG", desc: "Vorbis código aberto" },
  { id: "opus", label: "OPUS", desc: "Ultra-eficiente e moderno" },
];

const VIDEO_FORMATS = [
  { id: "mp4", label: "MP4", desc: "Universal H.264" },
  { id: "mov", label: "MOV", desc: "QuickTime Apple" },
  { id: "mkv", label: "MKV", desc: "Recursos avançados" },
  { id: "webm", label: "WebM", desc: "Vídeo web leve (VP9)" },
];

export const FormatPicker: React.FC<FormatPickerProps> = ({
  hasVideoInQueue,
  hasAudioInQueue,
  activeCategory,
  setActiveCategory,
  selectedFormat,
  onSelectFormat,
  extractAudioOnly: _extractAudioOnly,
  setExtractAudioOnly,
}) => {
  // Abas Áudio/Vídeo ficam sempre disponíveis: qualquer arquivo (música ou
  // vídeo) pode ser convertido para qualquer formato escolhido. Quando a fila
  // é só áudio e o usuário escolhe vídeo, um stream de vídeo é gerado.
  const generatingVideoFromAudio = !hasVideoInQueue && hasAudioInQueue && activeCategory === "video";

  return (
    <div className="settings-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card-title">
          <Music size={14} />
          <span>Formato de Saída</span>
        </div>

        {hasVideoInQueue && activeCategory === "audio" && (
          <span
            style={{
              fontSize: "0.72rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a5b4fc",
              padding: "2px 8px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Headphones size={11} />
            <span>Extração de Áudio Ativa</span>
          </span>
        )}

        {generatingVideoFromAudio && (
          <span
            style={{
              fontSize: "0.72rem",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#6ee7b7",
              padding: "2px 8px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Video size={11} />
            <span>Vídeo gerado a partir do áudio</span>
          </span>
        )}
      </div>

      <div className="format-tabs">
        <button
          type="button"
          className={`format-tab-btn ${activeCategory === "audio" ? "active" : ""}`}
          onClick={() => {
            setActiveCategory("audio");
            setExtractAudioOnly(hasVideoInQueue);
            if (!AUDIO_FORMATS.some((f) => f.id === selectedFormat)) {
              onSelectFormat("mp3");
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Music size={13} />
            <span>{hasVideoInQueue ? "Áudio (Extrair)" : "Áudio"}</span>
          </div>
        </button>

        <button
          type="button"
          className={`format-tab-btn ${activeCategory === "video" ? "active" : ""}`}
          onClick={() => {
            setActiveCategory("video");
            setExtractAudioOnly(false);
            if (!VIDEO_FORMATS.some((f) => f.id === selectedFormat)) {
              onSelectFormat("mp4");
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Video size={13} />
            <span>Vídeo</span>
          </div>
        </button>
      </div>

      <div className="format-pills">
        {activeCategory === "audio"
          ? AUDIO_FORMATS.map((fmt) => {
              const isSelected = selectedFormat.toLowerCase() === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  className={`format-pill ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelectFormat(fmt.id)}
                  title={fmt.desc}
                >
                  {fmt.label}
                </button>
              );
            })
          : VIDEO_FORMATS.map((fmt) => {
              const isSelected = selectedFormat.toLowerCase() === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  className={`format-pill ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelectFormat(fmt.id)}
                  title={fmt.desc}
                >
                  {fmt.label}
                </button>
              );
            })}
      </div>
    </div>
  );
};
