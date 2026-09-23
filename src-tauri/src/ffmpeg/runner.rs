use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct ConversionProgress {
    pub percent: f64,
    pub current_time_seconds: f64,
}

pub fn run_conversion<F>(
    ffmpeg_path: &Path,
    input_path: &Path,
    output_path: &Path,
    duration_seconds: f64,
    ffmpeg_args: &[String],
    cancel_token: Arc<AtomicBool>,
    mut on_progress: F,
) -> Result<PathBuf, String>
where
    F: FnMut(ConversionProgress),
{
    let mut cmd = Command::new(ffmpeg_path);
    cmd.arg("-y") // Sobrescreve apenas o arquivo de destino temporário/único já validado pelo collision.rs
        .arg("-i")
        .arg(input_path);

    for arg in ffmpeg_args {
        cmd.arg(arg);
    }

    cmd.arg("-progress")
        .arg("pipe:1")
        .arg("-nostats")
        .arg(output_path);

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Falha ao iniciar FFmpeg: {}", e))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Falha ao capturar stdout do FFmpeg".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Falha ao capturar stderr do FFmpeg".to_string())?;

    // Thread para capturar stderr em background (para diagnóstico se falhar)
    let stderr_handle = std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        let mut lines = Vec::new();
        for line in reader.lines().flatten() {
            lines.push(line);
            if lines.len() > 50 {
                lines.remove(0);
            }
        }
        lines.join("\n")
    });

    let stdout_reader = BufReader::new(stdout);
    let duration_us = (duration_seconds * 1_000_000.0) as i64;

    for line_res in stdout_reader.lines() {
        if cancel_token.load(Ordering::Relaxed) {
            let _ = child.kill();
            let _ = child.wait();
            if output_path.exists() {
                let _ = std::fs::remove_file(output_path);
            }
            return Err("Conversão cancelada pelo usuário.".to_string());
        }

        if let Ok(line) = line_res {
            let trimmed = line.trim();
            if let Some(val_str) = trimmed.strip_prefix("out_time_us=") {
                if let Ok(us) = val_str.parse::<i64>() {
                    let current_sec = (us as f64) / 1_000_000.0;
                    let percent = if duration_us > 0 {
                        ((us as f64) / (duration_us as f64) * 100.0).clamp(0.0, 99.0)
                    } else {
                        50.0
                    };
                    on_progress(ConversionProgress {
                        percent,
                        current_time_seconds: current_sec,
                    });
                }
            } else if trimmed == "progress=end" {
                on_progress(ConversionProgress {
                    percent: 100.0,
                    current_time_seconds: duration_seconds,
                });
            }
        }
    }

    let status = child
        .wait()
        .map_err(|e| format!("Erro ao aguardar processo do FFmpeg: {}", e))?;

    let stderr_output = stderr_handle.join().unwrap_or_default();

    if cancel_token.load(Ordering::Relaxed) {
        if output_path.exists() {
            let _ = std::fs::remove_file(output_path);
        }
        return Err("Conversão cancelada pelo usuário.".to_string());
    }

    if !status.success() {
        if output_path.exists() {
            let _ = std::fs::remove_file(output_path);
        }
        return Err(format!(
            "O FFmpeg retornou erro (código {:?}):\n{}",
            status.code(),
            stderr_output
        ));
    }

    on_progress(ConversionProgress {
        percent: 100.0,
        current_time_seconds: duration_seconds,
    });

    Ok(output_path.to_path_buf())
}
