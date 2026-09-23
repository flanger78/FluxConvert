pub mod collision;
pub mod presets;
pub mod probe;
pub mod runner;

use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Localiza o binário FFmpeg ou FFprobe no bundle do aplicativo ou em desenvolvimento
pub fn resolve_binary_path(app: &AppHandle, binary_name: &str) -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    let target_triple = if cfg!(target_arch = "aarch64") {
        "aarch64-apple-darwin"
    } else {
        "x86_64-apple-darwin"
    };

    #[cfg(target_os = "windows")]
    let target_triple = "x86_64-pc-windows-msvc";

    #[cfg(target_os = "linux")]
    let target_triple = "x86_64-unknown-linux-gnu";

    let ext = if cfg!(target_os = "windows") { ".exe" } else { "" };
    let triple_name = format!("{}-{}{}", binary_name, target_triple, ext);
    let plain_name = format!("{}{}", binary_name, ext);

    // 1. Tentar encontrar no resource_dir do Tauri (bundle de produção)
    if let Ok(resource_dir) = app.path().resource_dir() {
        let candidates = [
            resource_dir.join(&triple_name),
            resource_dir.join(&plain_name),
            resource_dir.join("binaries").join(&triple_name),
            resource_dir.join("binaries").join(&plain_name),
            resource_dir.join("_up_").join("binaries").join(&triple_name),
        ];
        for c in candidates {
            if c.exists() && c.is_file() {
                return Ok(c);
            }
        }
    }

    // 2. Tentar relativo ao diretório do executável atual (Contents/MacOS/...)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let candidates = [
                exe_dir.join(&triple_name),
                exe_dir.join(&plain_name),
                exe_dir.join("binaries").join(&triple_name),
                exe_dir.join("..").join("Resources").join(&triple_name),
                exe_dir.join("..").join("Resources").join("binaries").join(&triple_name),
            ];
            for c in candidates {
                if c.exists() && c.is_file() {
                    return Ok(c);
                }
            }
        }
    }

    // 3. Tentar caminhos locais de desenvolvimento
    let dev_candidates = [
        PathBuf::from("src-tauri").join("binaries").join(&triple_name),
        PathBuf::from("binaries").join(&triple_name),
        PathBuf::from("../src-tauri").join("binaries").join(&triple_name),
        PathBuf::from("src-tauri").join("binaries").join(&plain_name),
        PathBuf::from("binaries").join(&plain_name),
    ];
    for c in dev_candidates {
        if c.exists() && c.is_file() {
            return Ok(c.canonicalize().unwrap_or(c));
        }
    }

    // 4. Fallback para Homebrew caso esteja no Mac de desenvolvimento
    #[cfg(target_os = "macos")]
    {
        let brew_path = PathBuf::from(format!("/opt/homebrew/bin/{}", binary_name));
        if brew_path.exists() {
            return Ok(brew_path);
        }
    }

    Err(format!(
        "Binário '{}' não foi encontrado no bundle nem no ambiente de desenvolvimento.",
        binary_name
    ))
}
