use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaInfo {
    pub path: String,
    pub filename: String,
    pub extension: String,
    pub size: u64,
    pub duration_seconds: f64,
    pub formatted_duration: String,
    pub formatted_size: String,
    pub has_audio: bool,
    pub has_video: bool,
    /// Imagem estática embutida no arquivo (capa do álbum / cover art)
    pub has_cover: bool,
    pub cover_width: Option<u32>,
    pub cover_height: Option<u32>,
    pub audio_codec: Option<String>,
    pub video_codec: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub is_valid: bool,
}

#[derive(Deserialize)]
struct FFprobeOutput {
    streams: Option<Vec<FFprobeStream>>,
    format: Option<FFprobeFormat>,
}

#[derive(Deserialize)]
struct FFprobeStream {
    codec_type: Option<String>,
    codec_name: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    duration: Option<String>,
    disposition: Option<FFprobeDisposition>,
}

#[derive(Deserialize)]
struct FFprobeDisposition {
    attached_pic: Option<i32>,
}

#[allow(dead_code)]
#[derive(Deserialize)]
struct FFprobeFormat {
    duration: Option<String>,
    size: Option<String>,
    format_name: Option<String>,
}

pub fn format_duration(seconds: f64) -> String {
    if seconds <= 0.0 {
        return "00:00".to_string();
    }
    let total_secs = seconds.round() as u64;
    let hours = total_secs / 3600;
    let mins = (total_secs % 3600) / 60;
    let secs = total_secs % 60;
    if hours > 0 {
        format!("{:02}:{:02}:{:02}", hours, mins, secs)
    } else {
        format!("{:02}:{:02}", mins, secs)
    }
}

pub fn format_file_size(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;

    let b = bytes as f64;
    if b >= GB {
        format!("{:.2} GB", b / GB)
    } else if b >= MB {
        format!("{:.1} MB", b / MB)
    } else if b >= KB {
        format!("{:.0} KB", b / KB)
    } else {
        format!("{} B", bytes)
    }
}

/// Executa ffprobe no arquivo fornecido usando o binário especificado
pub fn probe_file(ffprobe_path: &Path, file_path: &Path) -> Result<MediaInfo, String> {
    let filename = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let extension = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let metadata = std::fs::metadata(file_path).map_err(|e| e.to_string())?;
    let file_size = metadata.len();

    let output = Command::new(ffprobe_path)
        .arg("-v")
        .arg("quiet")
        .arg("-print_format")
        .arg("json")
        .arg("-show_format")
        .arg("-show_streams")
        .arg(file_path)
        .output()
        .map_err(|e| format!("Falha ao executar ffprobe: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "ffprobe falhou com código: {:?}",
            output.status.code()
        ));
    }

    let parsed: FFprobeOutput = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Erro ao parsear saída do ffprobe: {}", e))?;

    let mut has_audio = false;
    let mut has_video = false;
    let mut has_cover = false;
    let mut audio_codec = None;
    let mut video_codec = None;
    let mut width = None;
    let mut height = None;
    let mut cover_width = None;
    let mut cover_height = None;
    let mut stream_duration = 0.0;

    if let Some(streams) = parsed.streams {
        for s in streams {
            match s.codec_type.as_deref() {
                Some("audio") => {
                    has_audio = true;
                    if audio_codec.is_none() {
                        audio_codec = s.codec_name;
                    }
                    if let Some(dur_str) = s.duration {
                        if let Ok(d) = dur_str.parse::<f64>() {
                            if d > stream_duration {
                                stream_duration = d;
                            }
                        }
                    }
                }
                Some("video") => {
                    let codec_name = s.codec_name.as_deref();
                    let attached_pic = s
                        .disposition
                        .as_ref()
                        .and_then(|d| d.attached_pic)
                        .unwrap_or(0)
                        == 1;

                    // Capa/arte embutida (imagem estática): não é um vídeo de verdade
                    let is_still_image =
                        attached_pic || matches!(codec_name, Some("png") | Some("mjpeg"));

                    if is_still_image {
                        has_cover = true;
                        if cover_width.is_none() {
                            cover_width = s.width;
                            cover_height = s.height;
                        }
                        if video_codec.is_none() {
                            video_codec = s.codec_name;
                        }
                        if width.is_none() {
                            width = s.width;
                            height = s.height;
                        }
                    } else {
                        has_video = true;
                        if video_codec.is_none() {
                            video_codec = s.codec_name;
                        }
                        width = s.width;
                        height = s.height;
                    }

                    if let Some(dur_str) = s.duration {
                        if let Ok(d) = dur_str.parse::<f64>() {
                            if d > stream_duration {
                                stream_duration = d;
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }

    let mut duration_seconds = stream_duration;
    if let Some(fmt) = parsed.format {
        if let Some(d_str) = fmt.duration {
            if let Ok(d) = d_str.parse::<f64>() {
                if d > 0.0 {
                    duration_seconds = d;
                }
            }
        }
    }

    Ok(MediaInfo {
        path: file_path.to_string_lossy().to_string(),
        filename,
        extension,
        size: file_size,
        duration_seconds,
        formatted_duration: format_duration(duration_seconds),
        formatted_size: format_file_size(file_size),
        has_audio,
        has_video,
        has_cover,
        cover_width,
        cover_height,
        audio_codec,
        video_codec,
        width,
        height,
        is_valid: has_audio || has_video,
    })
}
