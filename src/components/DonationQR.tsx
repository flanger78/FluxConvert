import React, { useState, useEffect } from "react";
import { Heart, X, ExternalLink, Award } from "lucide-react";

const PIX_PAYLOAD =
  "00020101021126500014br.gov.bcb.pix0128fabricio1978langer@gmail.com5204000053039865802BR5915FABRICIO LANGER6013SAO BENTO DO 62070503***63049A38";

const APP_NAME = "FluxConvert";

interface DonationQRProps {
  /**
   * Windows only: a cada incremento (a cada 5 musicas convertidas) o modal
   * abre automaticamente como lembrete de colaboracao.
   */
  promptToken?: number;
  /** Usuario ja colaborou: nunca mais recebe lembrete e ganha badge de Colaborador. */
  isCollaborator?: boolean;
  /** Marca o usuario como colaborador (o App persiste o estado). */
  onMarkCollaborator?: () => void;
}

const DonationQR: React.FC<DonationQRProps> = ({
  promptToken = 0,
  isCollaborator = false,
  onMarkCollaborator,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Lembrete automatico disparado pelo App (somente Windows)
  useEffect(() => {
    if (promptToken > 0 && !isCollaborator) {
      setIsOpen(true);
    }
  }, [promptToken, isCollaborator]);

  const closeModal = () => setIsOpen(false);

  const handleMarkCollaborator = () => {
    if (onMarkCollaborator) onMarkCollaborator();
    setIsOpen(false);
  };

  const handlePixLinkClick = () => {
    // Abrir o link Pix ja conta como colaboracao: nunca mais incomodamos a pessoa
    if (onMarkCollaborator) onMarkCollaborator();
    setIsOpen(false);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    PIX_PAYLOAD
  )}`;

  const pixLink = `https://pix.gov.br/pagamento?payload=${PIX_PAYLOAD}`;

  return (
    <>
      {/* Botao Flutuante / Badge de Colaborador */}
      {isCollaborator ? (
        <button
          className="collab-badge"
          onClick={() => setIsOpen(true)}
          title="Obrigado por colaborar com o FluxConvert!"
        >
          <Award size={16} />
          <span>Colaborador ❤️</span>
        </button>
      ) : (
        <button
          className="donation-fab"
          onClick={() => setIsOpen(true)}
          title="Apoiar o FluxConvert"
        >
          <Heart size={18} fill="currentColor" />
          <span className="donation-fab-text">Apoiar</span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="donation-overlay" onClick={closeModal}>
          <div className="donation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="donation-header">
              <div className="donation-title-row">
                {isCollaborator ? (
                  <Award size={22} className="donation-heart-icon" />
                ) : (
                  <Heart size={22} className="donation-heart-icon" fill="currentColor" />
                )}
                <h3 className="donation-title">
                  {isCollaborator ? "Obrigado, Colaborador!" : `Apoiar o ${APP_NAME}`}
                </h3>
              </div>
              <button
                className="donation-close"
                onClick={closeModal}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="donation-body">
              {isCollaborator ? (
                <p className="donation-message">
                  Você é um <strong>Colaborador ❤️</strong> do {APP_NAME}. Seu
                  apoio mantém o projeto vivo e gratuito para todos. Obrigado
                  de coração! 🎶
                </p>
              ) : (
                <>
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
                      onClick={handlePixLinkClick}
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

                  <button
                    className="btn-mark-collab"
                    onClick={handleMarkCollaborator}
                  >
                    <Award size={15} />
                    Já colaborei ❤️
                  </button>
                </>
              )}
            </div>

            <div className="donation-footer">
              {isCollaborator
                ? "Você faz parte do projeto ❤️"
                : "Feito com ❤️ para quem faz download"}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DonationQR;
