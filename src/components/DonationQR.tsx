import React, { useState } from "react";
import { Heart, X, ExternalLink } from "lucide-react";

const PIX_PAYLOAD =
  "00020101021126500014br.gov.bcb.pix0128fabricio1978langer@gmail.com5204000053039865802BR5915FABRICIO LANGER6013SAO BENTO DO 62070503***63049A38";

const APP_NAME = "FluxConvert";

const DonationQR: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    PIX_PAYLOAD
  )}`;

  const pixLink = `https://pix.gov.br/pagamento?payload=${PIX_PAYLOAD}`;

  return (
    <>
      {/* Botao Flutuante */}
      <button
        className="donation-fab"
        onClick={() => setIsOpen(true)}
        title="Apoiar o FluxConvert"
      >
        <Heart size={18} fill="currentColor" />
        <span className="donation-fab-text">Apoiar</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="donation-overlay" onClick={() => setIsOpen(false)}>
          <div className="donation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="donation-header">
              <div className="donation-title-row">
                <Heart size={22} className="donation-heart-icon" fill="currentColor" />
                <h3 className="donation-title">Apoiar o {APP_NAME}</h3>
              </div>
              <button
                className="donation-close"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="donation-body">
              <p className="donation-message">
                Se este app te ajudou de verdade, considere fazer uma
                contribuição de qualquer valor. Cada apoio mantém o projeto
                vivo e gratuito para todos. 🎶
              </p>

              <div className="donation-qr-section">
                <img
                  src={qrUrl}
                  alt="QR Code Pix"
                  className="donation-qr-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <p className="donation-qr-hint">
                  Escaneie com a câmera do celular ou seu app bancário
                </p>
              </div>

              <div className="donation-links">
                <a
                  href={pixLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donation-link-btn"
                >
                  <ExternalLink size={16} />
                  Abrir link Pix
                </a>
              </div>

              <div className="donation-note">
                <p>💳 Qualquer valor é bem-vindo!</p>
                <p className="donation-small">
                  Chave Pix: fabricio1978langer@gmail.com
                </p>
              </div>
            </div>

            <div className="donation-footer">
              <span>Feito com ❤️ para quem faz download</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DonationQR;
