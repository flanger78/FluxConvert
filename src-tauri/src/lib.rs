pub mod commands;
pub mod ffmpeg;

use std::sync::atomic::AtomicBool;
use std::sync::Arc;

use commands::{
    cancel_conversion, convert_media_file, open_folder, probe_media, reset_cancel_token,
    scan_directory, AppState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            cancel_token: Arc::new(AtomicBool::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            probe_media,
            scan_directory,
            convert_media_file,
            cancel_conversion,
            reset_cancel_token,
            open_folder
        ])
        .run(tauri::generate_context!())
        .expect("erro ao executar aplicação tauri");
}
