import React from "react";
import { Sliders } from "lucide-react";

interface QualityPickerProps {
  targetFormat: string;
  quality: string;
  onSelectQuality: (q: string) => void;
}

interface Option {
  id: string;
  label: string;
  desc: string;
}

export const QualityPicker: React.FC<QualityPickerProps> = ({
  targetFormat,
  quality,
  onSelectQuality,
}) => {
  const fmt = targetFormat.toLowerCase();

  let options: Option[] = [];

  if (fmt === "mp3") {
    options = [
      { id: "320", label: "Alta — 320 kbps", desc: "Qualidade máxima de estúdio (Padrão)" },
      { id: "256", label: "Boa — 256 kbps", desc: "Ótima fidelidade e equilíbrio" },
      { id: "192", label: "Normal — 192 kbps", desc: "Padrão de reprodução comum" },
      { id: "128", label: "Compacta — 128 kbps", desc: "Arquivo bem leve para compartilhamento" },
    ];
  } else if (fmt === "wav") {
    options = [
      { id: "24bit", label: "24-bit", desc: "Fidelidade e faixa dinâmica profissional (Padrão)" },
      { id: "16bit", label: "16-bit", desc: "Padrão clássico de CD de áudio" },
    ];
  } else if (fmt === "flac") {
    options = [
      { id: "lossless", label: "Alta Fidelidade Lossless", desc: "Preserva 100% dos dados originais sem perdas" },
    ];
  } else if (fmt === "m4a" || fmt === "aac") {
    options = [
      { id: "320", label: "Alta — 320 kbps", desc: "Bitrate máximo para formato AAC" },
      { id: "256", label: "Boa — 256 kbps", desc: "Padrão recomendado para ecossistema Apple" },
      { id: "192", label: "Normal — 192 kbps", desc: "Excelente compressão musical" },
      { id: "128", label: "Compacta — 128 kbps", desc: "Muito leve e eficiente" },
    ];
  } else if (fmt === "ogg") {
    options = [
      { id: "high", label: "Alta Fidelidade (Vorbis Q6)", desc: "Excelente fidelidade estéreo" },
      { id: "normal", label: "Normal (Vorbis Q4)", desc: "Tamanho equilibrado" },
    ];
  } else if (fmt === "opus") {
    options = [
      { id: "160", label: "Alta — 160 kbps", desc: "Máxima fidelidade para voz e música" },
      { id: "128", label: "Boa — 128 kbps", desc: "Padrão recomendado de alto desempenho" },
      { id: "96", label: "Compacta — 96 kbps", desc: "Muito leve e nítido" },
    ];
  } else {
    // Vídeo: MP4, MOV, MKV, WebM
    options = [
      { id: "high", label: "Alta qualidade", desc: "Máxima fidelidade visual e áudio nítido" },
      { id: "balanced", label: "Equilibrado", desc: "Excelente qualidade com tamanho ideal (Padrão)" },
      { id: "small", label: "Arquivo menor", desc: "Ideal para economizar espaço e enviar na web" },
    ];
  }

  return (
    <div className="settings-card">
      <div className="card-title">
        <Sliders size={14} />
        <span>Qualidade</span>
      </div>

      <div className="quality-options">
        {options.map((opt) => {
          const isSelected = quality === opt.id;
          return (
            <div
              key={opt.id}
              className={`quality-option ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectQuality(opt.id)}
            >
              <div>
                <div className="quality-label">{opt.label}</div>
                <div className="quality-desc">{opt.desc}</div>
              </div>

              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: isSelected
                    ? "5px solid var(--accent-primary)"
                    : "2px solid rgba(255,255,255,0.2)",
                  background: isSelected ? "#fff" : "transparent",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
