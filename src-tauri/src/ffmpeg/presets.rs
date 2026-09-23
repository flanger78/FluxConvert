use serde::{Deserialize, Serialize};

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

pub fn build_ffmpeg_args(
    options: &ConversionOptions,
    is_source_video: bool,
) -> FfmpegArgs {
    let target = options.target_format.to_lowercase();
    let quality = options.quality.as_deref().unwrap_or("default");

    let is_target_audio = matches!(
        target.as_str(),
        "mp3" | "wav" | "flac" | "m4a" | "aac" | "ogg" | "opus"
    );

    let mut args: Vec<String> = Vec::new();

    // Se a fonte for vídeo e o destino for áudio (ou se explicitamente pediu extração)
    if (is_source_video && is_target_audio) || options.extract_audio_only {
        args.push("-vn".to_string()); // descarta vídeo
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
