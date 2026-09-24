use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use walkdir::WalkDir;

use crate::ffmpeg::collision::get_unique_output_path;
use crate::ffmpeg::presets::{build_ffmpeg_args, ConversionOptions};
use crate::ffmpeg::probe::{probe_file, MediaInfo};
use crate::ffmpeg::resolve_binary_path;
use crate::ffmpeg::runner::run_conversion;

pub struct AppState {
    pub cancel_token: Arc<AtomicBool>,
}

#[derive(serde::Deserialize)]
pub struct ConvertItemRequest {
    pub file_id: String,
    pub input_path: String,
    pub custom_output_dir: Option<String>,
    pub options: ConversionOptions,
}

#[derive(serde::Serialize)]
pub struct ConvertItemResult {
    pub file_id: String,
    pub output_path: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Clone, serde::Serialize)]
pub struct ProgressPayload {
    pub file_id: String,
    pub percent: f64,
    pub current_time_seconds: f64,
    pub total_duration_seconds: f64,
}

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "wav", "mp3", "flac", "m4a", "aac", "aiff", "ogg", "opus", "wma",
    "mp4", "mov", "mkv", "avi", "webm", "mpeg", "mpg", "m4v", "wmv",
];

#[tauri::command]
pub async fn probe_media(app: AppHandle, path: String) -> Result<MediaInfo, String> {
    let ffprobe_bin = resolve_binary_path(&app, "ffprobe")?;
    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("Arquivo não encontrado: {}", path));
    }
    probe_file(&ffprobe_bin, &file_path)
}

#[derive(serde::Serialize)]
pub struct FolderScanResult {
    pub folder_name: String,
    pub folder_path: String,
    pub total_files_found: usize,
    pub media_files: Vec<MediaInfo>,
}

#[tauri::command]
pub async fn scan_directory(app: AppHandle, dir_path: String) -> Result<FolderScanResult, String> {
    let ffprobe_bin = resolve_binary_path(&app, "ffprobe")?;
    let root = PathBuf::from(&dir_path);
    if !root.is_dir() {
        return Err(format!("O caminho não é uma pasta válida: {}", dir_path));
    }

    let folder_name = root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| dir_path.clone());

    let mut found_files = Vec::new();
    for entry in WalkDir::new(&root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str()) {
                    if let Ok(info) = probe_file(&ffprobe_bin, path) {
                        if info.is_valid {
                            found_files.push(info);
                            continue;
                        }
                    }

                    // Fallback para arquivos válidos caso o ffprobe demore ou falhe na leitura de stream
                    let filename = path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();
                    let file_size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
                    let is_audio = [
                        "wav", "mp3", "flac", "m4a", "aac", "aiff", "ogg", "opus", "wma",
                    ]
                    .contains(&ext_lower.as_str());

                    found_files.push(MediaInfo {
                        path: path.to_string_lossy().to_string(),
                        filename,
                        extension: ext_lower,
                        size: file_size,
                        duration_seconds: 0.0,
                        formatted_duration: "00:00".to_string(),
                        formatted_size: crate::ffmpeg::probe::format_file_size(file_size),
                        has_audio: is_audio,
                        has_video: !is_audio,
                        audio_codec: None,
                        video_codec: None,
                        width: None,
                        height: None,
                        is_valid: true,
                    });
                }
            }
        }
    }

    let total = found_files.len();
    Ok(FolderScanResult {
        folder_name,
        folder_path: dir_path,
        total_files_found: total,
        media_files: found_files,
    })
}

#[tauri::command]
pub async fn convert_media_file(
    app: AppHandle,
    state: State<'_, AppState>,
    request: ConvertItemRequest,
) -> Result<ConvertItemResult, String> {
    let ffmpeg_bin = resolve_binary_path(&app, "ffmpeg")?;
    let ffprobe_bin = resolve_binary_path(&app, "ffprobe")?;

    let input_path = PathBuf::from(&request.input_path);
    if !input_path.exists() {
        return Ok(ConvertItemResult {
            file_id: request.file_id,
            output_path: "".to_string(),
            success: false,
            error: Some("Arquivo de origem não existe mais no disco.".to_string()),
        });
    }

    // Obter metadados da fonte
    let media_info = probe_file(&ffprobe_bin, &input_path).map_err(|e| {
        format!("Não foi possível ler as propriedades da mídia: {}", e)
    })?;

    // Determinar argumentos de conversão
    let ffmpeg_args = build_ffmpeg_args(&request.options, media_info.has_video);

    // Determinar diretório de saída
    let target_dir = match &request.custom_output_dir {
        Some(dir_str) if !dir_str.trim().is_empty() => PathBuf::from(dir_str),
        _ => input_path
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| PathBuf::from(".")),
    };

    if !target_dir.exists() {
        let _ = std::fs::create_dir_all(&target_dir);
    }

    let file_stem = input_path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "convertido".to_string());

    // Obter nome único sem sobrescrever
    let output_path = get_unique_output_path(&target_dir, &file_stem, &ffmpeg_args.output_extension);

    let file_id_clone = request.file_id.clone();
    let total_duration = media_info.duration_seconds;
    let cancel_token = state.cancel_token.clone();
    let app_handle = app.clone();

    // Executar conversão
    let run_res = run_conversion(
        &ffmpeg_bin,
        &input_path,
        &output_path,
        total_duration,
        &ffmpeg_args.args,
        cancel_token,
        move |prog| {
            let _ = app_handle.emit(
                "conversion-progress",
                ProgressPayload {
                    file_id: file_id_clone.clone(),
                    percent: prog.percent,
                    current_time_seconds: prog.current_time_seconds,
                    total_duration_seconds: total_duration,
                },
            );
        },
    );

    match run_res {
        Ok(final_path) => Ok(ConvertItemResult {
            file_id: request.file_id,
            output_path: final_path.to_string_lossy().to_string(),
            success: true,
            error: None,
        }),
        Err(err_msg) => Ok(ConvertItemResult {
            file_id: request.file_id,
            output_path: "".to_string(),
            success: false,
            error: Some(err_msg),
        }),
    }
}

#[tauri::command]
pub async fn cancel_conversion(state: State<'_, AppState>) -> Result<(), String> {
    state.cancel_token.store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
pub async fn reset_cancel_token(state: State<'_, AppState>) -> Result<(), String> {
    state.cancel_token.store(false, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
pub fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("O caminho não existe: {}", path));
    }

    #[cfg(target_os = "macos")]
    {
        if p.is_file() {
            // Revela no Finder com o arquivo selecionado
            let _ = std::process::Command::new("open")
                .arg("-R")
                .arg(path)
                .spawn();
        } else {
            // Abre o diretório
            let _ = std::process::Command::new("open")
                .arg(path)
                .spawn();
        }
    }

    #[cfg(target_os = "windows")]
    {
        if p.is_file() {
            let _ = std::process::Command::new("explorer")
                .arg(format!("/select,\"{}\"", path))
                .spawn();
        } else {
            let _ = std::process::Command::new("explorer")
                .arg(path)
                .spawn();
        }
    }

    #[cfg(target_os = "linux")]
    {
        let target = if p.is_file() {
            p.parent().unwrap_or(p)
        } else {
            p
        };
        let _ = std::process::Command::new("xdg-open")
            .arg(target)
            .spawn();
    }

    Ok(())
}
