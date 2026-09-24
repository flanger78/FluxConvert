import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import { Loader2, AlertTriangle, X } from "lucide-react";

import { Header } from "./components/Header";
import DonationQR from "./components/DonationQR";
import { DropZone } from "./components/DropZone";
import { FileList } from "./components/FileList";
import { FormatPicker } from "./components/FormatPicker";
import { QualityPicker } from "./components/QualityPicker";
import { DestinationPicker } from "./components/DestinationPicker";
import { ActionBar } from "./components/ActionBar";
import { ErrorModal } from "./components/ErrorModal";
import { SelectedFolderBanner } from "./components/SelectedFolderBanner";
import { FolderInfo, FolderScanResult, MediaInfo, QueueItem } from "./types";

interface ProgressEventPayload {
  file_id: string;
  percent: number;
  current_time_seconds: number;
  total_duration_seconds: number;
}

interface ConvertResult {
  file_id: string;
  output_path: string;
  success: boolean;
  error?: string;
}

export const App: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);
  const [isScanningFolder, setIsScanningFolder] = useState<boolean>(false);
  const [folderNotice, setFolderNotice] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<"audio" | "video">("audio");
  const [targetFormat, setTargetFormat] = useState<string>("mp3");
  const [quality, setQuality] = useState<string>("320");
  const [extractAudioOnly, setExtractAudioOnly] = useState<boolean>(false);
  const [outputFolderMode, setOutputFolderMode] = useState<"same_as_input" | "custom">("same_as_input");
  const [customOutputFolder, setCustomOutputFolder] = useState<string>("");

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [overallPercent, setOverallPercent] = useState<number>(0);
  const [lastOutputLocation, setLastOutputLocation] = useState<string>("");
  const [errorModalItem, setErrorModalItem] = useState<QueueItem | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Controle de colaboracao (somente Windows)
  const [isWindows, setIsWindows] = useState<boolean>(false);
  const [isCollaborator, setIsCollaborator] = useState<boolean>(false);
  const [collabPromptToken, setCollabPromptToken] = useState<number>(0);
  const promptedAtRef = useRef<number>(0);

  const cancelRequestedRef = useRef<boolean>(false);

  useEffect(() => {
    invoke<string>("get_platform")
      .then((platform) => {
        if (platform === "windows") {
          setIsWindows(true);
          try {
            setIsCollaborator(localStorage.getItem("fluxconvert_collaborator") === "1");
            promptedAtRef.current = Number(
              localStorage.getItem("fluxconvert_prompted_at") || "0"
            );
          } catch {
            /* localStorage indisponivel */
          }
        }
      })
      .catch(() => {
        /* ambiente sem backend: recurso desativado */
      });
  }, []);

  useEffect(() => {
    let unlistenDragDrop: (() => void) | undefined;

    try {
      const appWindow = getCurrentWebviewWindow();
      appWindow.onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setIsDragOver(true);
        } else if (event.payload.type === "leave") {
          setIsDragOver(false);
        } else if (event.payload.type === "drop") {
          setIsDragOver(false);
          const paths = event.payload.paths;
          if (paths && paths.length > 0) {
            handleAddPaths(paths);
          }
        }
      }).then((unlisten) => {
        unlistenDragDrop = unlisten;
      });
    } catch (e) {
      console.warn("Ambiente sem suporte a window.onDragDropEvent:", e);
    }

    return () => {
      if (unlistenDragDrop) unlistenDragDrop();
    };
  }, []);

  useEffect(() => {
    const unlistenPromise = listen<ProgressEventPayload>("conversion-progress", (event) => {
      const { file_id, percent, current_time_seconds } = event.payload;

      setQueue((prev) =>
        prev.map((item) => {
          if (item.id === file_id) {
            return {
              ...item,
              progress: percent,
              currentTimeSeconds: current_time_seconds,
            };
          }
          return item;
        })
      );
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const handleSelectFormat = (newFormat: string) => {
    setTargetFormat(newFormat);
    const fmt = newFormat.toLowerCase();
    if (fmt === "mp3") {
      setQuality("320");
    } else if (fmt === "wav") {
      setQuality("24bit");
    } else if (fmt === "flac") {
      setQuality("lossless");
    } else if (fmt === "m4a" || fmt === "aac") {
      setQuality("256");
    } else if (fmt === "opus") {
      setQuality("128");
    } else if (fmt === "ogg") {
      setQuality("high");
    } else {
      setQuality("balanced");
    }
  };

  const handleAddPaths = async (paths: string[]) => {
    setFolderNotice(null);
    for (const p of paths) {
      try {
        const folderResult = await invoke<FolderScanResult>("scan_directory", { dirPath: p }).catch(() => null);

        if (folderResult) {
          if (folderResult.total_files_found > 0) {
            setSelectedFolder({
              name: folderResult.folder_name,
              path: folderResult.folder_path,
              count: folderResult.total_files_found,
            });
            addMediaInfosToQueue(folderResult.media_files);
          } else {
            setFolderNotice(`A pasta "${folderResult.folder_name}" não contém arquivos de áudio ou vídeo compatíveis.`);
          }
          continue;
        }

        const fileInfo = await invoke<MediaInfo>("probe_media", { path: p }).catch((err) => {
          console.warn("Falha ao ler arquivo:", p, err);
          return null;
        });

        if (fileInfo && fileInfo.is_valid) {
          addMediaInfosToQueue([fileInfo]);
        }
      } catch (err) {
        console.error("Erro ao processar caminho:", p, err);
      }
    }
  };

  const addMediaInfosToQueue = (infos: MediaInfo[]) => {
    setQueue((prev) => {
      const existingPaths = new Set(prev.map((i) => i.mediaInfo.path));
      const newItems: QueueItem[] = [];

      for (const info of infos) {
        if (!existingPaths.has(info.path)) {
          newItems.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            mediaInfo: info,
            targetFormat,
            quality,
            extractAudio: extractAudioOnly,
            status: "idle",
            progress: 0,
            currentTimeSeconds: 0,
          });
          existingPaths.add(info.path);
        }
      }

      const combined = [...prev, ...newItems];

      setSelectedFolder((f) => (f ? { ...f, count: combined.length } : null));

      const hasAnyVideo = combined.some((i) => i.mediaInfo.has_video);
      const hasOnlyAudio = !hasAnyVideo && combined.every((i) => i.mediaInfo.has_audio);

      if (hasOnlyAudio && activeCategory === "video") {
        setActiveCategory("audio");
        setTargetFormat("mp3");
        setQuality("320");
      }

      return combined;
    });
  };

  const handleSelectFiles = async () => {
    try {
      setFolderNotice(null);
      const selected = await open({
        multiple: true,
        directory: false,
        title: "Selecione arquivos de áudio ou vídeo",
        filters: [
          {
            name: "Mídia Suportada",
            extensions: [
              "wav", "mp3", "flac", "m4a", "aac", "aiff", "ogg", "opus", "wma",
              "mp4", "mov", "mkv", "avi", "webm", "mpeg", "mpg", "m4v", "wmv",
            ],
          },
          { name: "Todos os Arquivos", extensions: ["*"] },
        ],
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        handleAddPaths(paths);
      }
    } catch (err) {
      console.error("Erro ao selecionar arquivos:", err);
    }
  };

  const handleSelectFolder = async () => {
    try {
      setIsScanningFolder(true);
      setFolderNotice(null);
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Selecione uma pasta contendo músicas ou vídeos",
      });

      if (selected && typeof selected === "string") {
        const scanRes = await invoke<FolderScanResult>("scan_directory", { dirPath: selected });
        if (scanRes && scanRes.total_files_found > 0) {
          setSelectedFolder({
            name: scanRes.folder_name,
            path: scanRes.folder_path,
            count: scanRes.total_files_found,
          });
          addMediaInfosToQueue(scanRes.media_files);
        } else {
          setFolderNotice(`A pasta "${scanRes.folder_name}" não contém arquivos de áudio ou vídeo compatíveis.`);
        }
      }
    } catch (err) {
      console.error("Erro ao selecionar pasta:", err);
    } finally {
      setIsScanningFolder(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setSelectedFolder((f) => (f ? { ...f, count: next.length } : null));
      return next;
    });
  };

  const handleClearAll = () => {
    if (!isConverting) {
      setQueue([]);
      setSelectedFolder(null);
      setFolderNotice(null);
      setOverallPercent(0);
      setCurrentIndex(0);
    }
  };

  const handleClearCompleted = () => {
    if (!isConverting) {
      setQueue((prev) => {
        const next = prev.filter((item) => item.status !== "completed");
        setSelectedFolder((f) => (f ? { ...f, count: next.length } : null));
        return next;
      });
    }
  };

  const handleStartConversion = async () => {
    if (queue.length === 0 || isConverting) return;

    cancelRequestedRef.current = false;
    await invoke("reset_cancel_token");
    setIsConverting(true);

    const pendingIndices: number[] = [];
    queue.forEach((item, idx) => {
      if (item.status === "idle" || item.status === "error" || item.status === "cancelled") {
        pendingIndices.push(idx);
      }
    });

    if (pendingIndices.length === 0) {
      setIsConverting(false);
      return;
    }

    const totalToConvert = queue.length;
    let completedCount = queue.filter((i) => i.status === "completed").length;

    for (let i = 0; i < queue.length; i++) {
      if (cancelRequestedRef.current) break;

      const item = queue[i];
      if (item.status === "completed") continue;

      setCurrentIndex(i);

      setQueue((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, status: "converting", progress: 0 } : it
        )
      );

      try {
        const result = await invoke<ConvertResult>("convert_media_file", {
          request: {
            file_id: item.id,
            input_path: item.mediaInfo.path,
            custom_output_dir: outputFolderMode === "custom" ? customOutputFolder : null,
            options: {
              target_format: targetFormat,
              quality: quality,
              extract_audio_only: extractAudioOnly,
            },
          },
        });

        if (cancelRequestedRef.current) {
          setQueue((prev) =>
            prev.map((it, idx) =>
              idx === i ? { ...it, status: "cancelled", progress: 0 } : it
            )
          );
          break;
        }

        if (result.success) {
          completedCount += 1;
          registerSuccessfulConversion();
          setLastOutputLocation(result.output_path);
          setQueue((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    status: "completed",
                    progress: 100,
                    outputPath: result.output_path,
                  }
                : it
            )
          );
        } else {
          setQueue((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    status: "error",
                    progress: 0,
                    errorMessage: result.error || "Erro desconhecido durante a conversão.",
                  }
                : it
            )
          );
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: "error",
                  progress: 0,
                  errorMessage: String(err),
                }
              : it
          )
        );
      }

      const overall = ((i + 1) / totalToConvert) * 100;
      setOverallPercent(overall);
    }

    setIsConverting(false);
  };

  // Registra cada conversao concluida e, no Windows, abre o lembrete de
  // colaboracao a cada 5 musicas (nunca para quem ja e Colaborador).
  const registerSuccessfulConversion = () => {
    if (!isWindows) return;

    let count = 0;
    try {
      if (localStorage.getItem("fluxconvert_collaborator") === "1") return;
      count = Number(localStorage.getItem("fluxconvert_converted_count") || "0") + 1;
      localStorage.setItem("fluxconvert_converted_count", String(count));
    } catch {
      return;
    }

    if (count % 5 === 0 && promptedAtRef.current !== count) {
      promptedAtRef.current = count;
      try {
        localStorage.setItem("fluxconvert_prompted_at", String(count));
      } catch {
        /* ignora */
      }
      setCollabPromptToken((t) => t + 1);
    }
  };

  const handleMarkCollaborator = () => {
    setIsCollaborator(true);
    try {
      localStorage.setItem("fluxconvert_collaborator", "1");
    } catch {
      /* ignora */
    }
  };

  const handleCancelConversion = async () => {
    cancelRequestedRef.current = true;
    try {
      await invoke("cancel_conversion");
    } catch (e) {
      console.error("Erro ao enviar cancelamento:", e);
    }
    setIsConverting(false);
    setQueue((prev) =>
      prev.map((item) =>
        item.status === "converting" ? { ...item, status: "cancelled", progress: 0 } : item
      )
    );
  };

  const handleOpenFolder = async () => {
    if (!lastOutputLocation) return;
    try {
      await invoke("open_folder", { path: lastOutputLocation });
    } catch (e) {
      console.error("Erro ao abrir pasta:", e);
    }
  };

  const hasVideoInQueue = queue.some((i) => i.mediaInfo.has_video);
  const hasAudioInQueue = queue.some((i) => i.mediaInfo.has_audio);
  const completedCount = queue.filter((i) => i.status === "completed").length;
  const errorCount = queue.filter((i) => i.status === "error").length;
  const currentFileName = queue[currentIndex]?.mediaInfo.filename || "";

  const defaultFolderLocation = selectedFolder
    ? selectedFolder.path
    : queue.length > 0 && queue[0].mediaInfo.path.includes("/")
    ? queue[0].mediaInfo.path.substring(0, queue[0].mediaInfo.path.lastIndexOf("/"))
    : undefined;

  return (
    <div className="app-container">
      <Header
        hasItems={queue.length > 0}
        hasCompletedItems={completedCount > 0}
        onClearAll={handleClearAll}
        onClearCompleted={handleClearCompleted}
        isConverting={isConverting}
      />

      <div className="app-body">
        <div className="content-scrollable">
          {selectedFolder && (
            <SelectedFolderBanner
              folder={selectedFolder}
              onChangeFolder={handleSelectFolder}
              onClearFolder={() => {
                setSelectedFolder(null);
                handleClearAll();
              }}
              isConverting={isConverting}
            />
          )}

          {isScanningFolder && (
            <div className="scanning-indicator">
              <Loader2 size={18} className="spin" />
              <span>Escaneando pasta selecionada... Buscando arquivos de áudio e vídeo...</span>
            </div>
          )}

          {folderNotice && (
            <div
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#fde68a",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={16} />
                <span>{folderNotice}</span>
              </div>
              <button
                type="button"
                className="btn-remove-item"
                style={{ padding: "4px" }}
                onClick={() => setFolderNotice(null)}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {queue.length === 0 ? (
            <DropZone
              onSelectFiles={handleSelectFiles}
              onSelectFolder={handleSelectFolder}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              onDropPaths={handleAddPaths}
            />
          ) : (
            <>
              <DropZone
                compact
                onSelectFiles={handleSelectFiles}
                onSelectFolder={handleSelectFolder}
                isDragOver={isDragOver}
                setIsDragOver={setIsDragOver}
                onDropPaths={handleAddPaths}
              />

              <FileList
                items={queue}
                onRemoveItem={handleRemoveItem}
                onShowError={(item) => setErrorModalItem(item)}
                isConverting={isConverting}
              />
            </>
          )}

          <div className="settings-grid">
            <FormatPicker
              hasVideoInQueue={hasVideoInQueue}
              hasAudioInQueue={hasAudioInQueue}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              selectedFormat={targetFormat}
              onSelectFormat={handleSelectFormat}
              extractAudioOnly={extractAudioOnly}
              setExtractAudioOnly={setExtractAudioOnly}
            />

            <QualityPicker
              targetFormat={targetFormat}
              quality={quality}
              onSelectQuality={setQuality}
            />
          </div>

          <DestinationPicker
            mode={outputFolderMode}
            setMode={setOutputFolderMode}
            customFolder={customOutputFolder}
            setCustomFolder={setCustomOutputFolder}
            defaultFolderLocation={defaultFolderLocation}
            disabled={isConverting}
          />
        </div>

        <ActionBar
          hasItems={queue.length > 0}
          isConverting={isConverting}
          currentIndex={currentIndex}
          totalFiles={queue.length}
          currentFileName={currentFileName}
          overallPercent={overallPercent}
          completedCount={completedCount}
          errorCount={errorCount}
          onStartConversion={handleStartConversion}
          onCancelConversion={handleCancelConversion}
          onOpenFolder={handleOpenFolder}
          lastOutputLocation={lastOutputLocation}
        />
      </div>

      <ErrorModal
        item={errorModalItem}
        onClose={() => setErrorModalItem(null)}
      />
      <DonationQR
        promptToken={collabPromptToken}
        isCollaborator={isWindows && isCollaborator}
        onMarkCollaborator={handleMarkCollaborator}
      />
    </div>
  );
};
