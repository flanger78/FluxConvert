use serde::{Deserialize, Serialize};

use super::probe::MediaInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionOptions {
    pub target_format: String,      // mp3, wav, flac, m4a, ogg, opus, mp4, mov, mkv, webm
    pub quality: Option<String>,    // "320", "256", "24bit", "high", "balanced", "small", etc.
    pub extract_audio_only: bool,   // Força remoção de vídeo ao converter de vídeo para áudio
}

pub struct FfmpegArgs {
    pub args: Vec<String>,
    pub output_extension: String,
}

/// Dimensões do vídeo gerado quando a origem não tem vídeo (música -> vídeo)
const VIDEO_WIDTH: u32 = 1280;
const VIDEO_HEIGHT: u32 = 720;
const VIDEO_FPS: u32 = 30;
const VIDEO_BACKGROUND: &str = "0x101010";
/// Rótulo do stream de vídeo criado dentro do filter_complex
const VIDEO_LABEL: &str = "[flux_video]";

/// Descrição da mídia de origem usada para montar os argumentos do FFmpeg.
#[derive(Debug, Clone, Default)]
pub struct SourceMedia {
    /// Possui vídeo de verdade (capa/arte embutida não conta)
    pub has_video: bool,
    /// Possui faixa de áudio
    pub has_audio: bool,
    /// Duração em segundos (0.0 quando desconhecida)
    pub duration_seconds: f64,
    /// Possui imagem estática embutida (capa do álbum)
    pub has_cover: bool,
}

impl From<&MediaInfo> for SourceMedia {
    fn from(info: &MediaInfo) -> Self {
        SourceMedia {
            has_video: info.has_video,
            has_audio: info.has_audio,
            duration_seconds: info.duration_seconds,
            has_cover: info.has_cover,
        }
    }
}

/// Monta os argumentos que criam um stream de vídeo para origens que são
/// apenas áudio: usa a capa do álbum quando existe, senão um fundo sólido.
fn build_generated_video_args(source: &SourceMedia) -> Vec<String> {
    let mut args: Vec<String> = Vec::new();
    let duration_known = source.duration_seconds > 0.0;
    // Só faz sentido usar a capa se houver áudio para acompanhar a imagem
    let use_cover = source.has_cover && source.has_audio;

    if use_cover {
        // Imagem fixa esticada/cabida em 1280x720, repetida infinitamente
        args.push("-filter_complex".to_string());
        args.push(format!(
            "[0:v:0]scale={w}:{h}:force_original_aspect_ratio=decrease,\
             pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,\
             loop=loop=-1:size=1,fps={fps},format=yuv420p{label}",
            w = VIDEO_WIDTH,
            h = VIDEO_HEIGHT,
            fps = VIDEO_FPS,
            label = VIDEO_LABEL
        ));
    } else {
        // Fundo sólido com a duração exata da música (quando conhecida)
        let color_source = if duration_known {
            format!(
                "color=c={bg}:s={w}x{h}:r={fps}:d={dur:.3}",
                bg = VIDEO_BACKGROUND,
                w = VIDEO_WIDTH,
                h = VIDEO_HEIGHT,
                fps = VIDEO_FPS,
                dur = source.duration_seconds
            )
        } else {
            format!(
                "color=c={bg}:s={w}x{h}:r={fps}",
                bg = VIDEO_BACKGROUND,
                w = VIDEO_WIDTH,
                h = VIDEO_HEIGHT,
                fps = VIDEO_FPS
            )
        };
        args.push("-filter_complex".to_string());
        args.push(format!("{}{}", color_source, VIDEO_LABEL));
    }

    args.push("-map".to_string());
    args.push(VIDEO_LABEL.to_string());

    if source.has_audio {
        args.push("-map".to_string());
        args.push("0:a:0".to_string());
    }

    // Imagem fixa infinita: encerra junto com o fim do áudio
    if use_cover || (!duration_known && source.has_audio) {
        args.push("-shortest".to_string());
    }

    // Salvaguarda para origem sem áudio e sem duração conhecida (não deve
    // acontecer: arquivos inválidos não entram na fila)
    if !source.has_audio && !duration_known {
        args.push("-t".to_string());
        args.push("1.0".to_string());
    }

    args
}

pub fn build_ffmpeg_args(options: &ConversionOptions, source: &SourceMedia) -> FfmpegArgs {
    let target = options.target_format.to_lowercase();
    let quality = options.quality.as_deref().unwrap_or("default");

    let is_target_audio = matches!(
        target.as_str(),
        "mp3" | "wav" | "flac" | "m4a" | "aac" | "ogg" | "opus"
    );
    let is_target_video = matches!(target.as_str(), "mp4" | "mov" | "mkv" | "webm");

    let mut args: Vec<String> = Vec::new();

    // Descarta o stream de vídeo quando o destino é só áudio (ou quando o
    // usuário pediu extração de áudio). A capa também é descartada para
    // M4A/AAC, cujo contêiner não aceita imagem como faixa de vídeo.
    let drop_video = options.extract_audio_only
        || (is_target_audio && source.has_video)
        || (is_target_audio && source.has_cover && matches!(target.as_str(), "m4a" | "aac"));

    if drop_video {
        args.push("-vn".to_string()); // descarta vídeo
    }

    // Origem só de áudio para um formato de vídeo: cria o stream de vídeo
    if is_target_video && !source.has_video && !options.extract_audio_only {
        args.extend(build_generated_video_args(source));
    }

    match target.as_str() {
        "mp3" => {
            args.extend(vec![
                "-c:a".to_string(),
                "libmp3lame".to_string(),
            ]);
            let bitrate = match quality {
                "256" => "256k",
                "192" => "192k",
                "128" => "128k",
                _ => "320k", // Alta - 320 kbps (padrão)
            };
            args.extend(vec!["-b:a".to_string(), bitrate.to_string()]);
            FfmpegArgs {
                args,
                output_extension: "mp3".to_string(),
            }
        }
        "wav" => {
            let codec = match quality {
                "16bit" => "pcm_s16le",
                _ => "pcm_s24le", // 24-bit (padrão quando possível)
            };
            args.extend(vec![
                "-c:a".to_string(),
                codec.to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "wav".to_string(),
            }
        }
        "flac" => {
            args.extend(vec![
                "-c:a".to_string(),
                "flac".to_string(),
                "-compression_level".to_string(),
                "5".to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "flac".to_string(),
            }
        }
        "m4a" | "aac" => {
            let bitrate = match quality {
                "320" => "320k",
                "192" => "192k",
                "128" => "128k",
                _ => "256k", // Padrão
            };
            args.extend(vec![
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                bitrate.to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "m4a".to_string(),
            }
        }
        "ogg" => {
            args.extend(vec![
                "-c:a".to_string(),
                "libvorbis".to_string(),
                "-qscale:a".to_string(),
                "6".to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "ogg".to_string(),
            }
        }
        "opus" => {
            let bitrate = match quality {
                "160" => "160k",
                "96" => "96k",
                _ => "128k", // Padrão
            };
            args.extend(vec![
                "-c:a".to_string(),
                "libopus".to_string(),
                "-b:a".to_string(),
                bitrate.to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "opus".to_string(),
            }
        }
        "mp4" => {
            let (crf, audio_b) = match quality {
                "high" => ("18", "256k"),
                "small" => ("28", "128k"),
                _ => ("23", "192k"), // Equilibrado
            };
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-crf".to_string(),
                crf.to_string(),
                "-preset".to_string(),
                "fast".to_string(),
                "-pix_fmt".to_string(),
                "yuv420p".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                audio_b.to_string(),
                "-movflags".to_string(),
                "+faststart".to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "mp4".to_string(),
            }
        }
        "mov" => {
            let (crf, audio_b) = match quality {
                "high" => ("18", "256k"),
                "small" => ("28", "128k"),
                _ => ("23", "192k"),
            };
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-crf".to_string(),
                crf.to_string(),
                "-preset".to_string(),
                "fast".to_string(),
                "-pix_fmt".to_string(),
                "yuv420p".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                audio_b.to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "mov".to_string(),
            }
        }
        "mkv" => {
            let (crf, audio_b) = match quality {
                "high" => ("18", "256k"),
                "small" => ("28", "128k"),
                _ => ("23", "192k"),
            };
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-crf".to_string(),
                crf.to_string(),
                "-preset".to_string(),
                "fast".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                audio_b.to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "mkv".to_string(),
            }
        }
        "webm" => {
            let (crf, audio_b) = match quality {
                "high" => ("28", "160k"),
                "small" => ("38", "96k"),
                _ => ("33", "128k"),
            };
            args.extend(vec![
                "-c:v".to_string(),
                "libvpx-vp9".to_string(),
                "-crf".to_string(),
                crf.to_string(),
                "-b:v".to_string(),
                "0".to_string(),
                "-c:a".to_string(),
                "libopus".to_string(),
                "-b:a".to_string(),
                audio_b.to_string(),
            ]);
            FfmpegArgs {
                args,
                output_extension: "webm".to_string(),
            }
        }
        _ => {
            // Padrão de segurança: cópia direta ou mp3
            args.extend(vec!["-c:a".to_string(), "libmp3lame".to_string(), "-b:a".to_string(), "320k".to_string()]);
            FfmpegArgs {
                args,
                output_extension: "mp3".to_string(),
            }
        }
    }
}
