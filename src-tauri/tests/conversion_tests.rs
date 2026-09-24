use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use fluxconvert_lib::ffmpeg::collision::get_unique_output_path;
use fluxconvert_lib::ffmpeg::presets::{build_ffmpeg_args, ConversionOptions, SourceMedia};
use fluxconvert_lib::ffmpeg::probe::probe_file;
use fluxconvert_lib::ffmpeg::runner::run_conversion;

fn get_ffmpeg_bin() -> PathBuf {
    let p = PathBuf::from("binaries/ffmpeg-aarch64-apple-darwin");
    if p.exists() {
        return p.canonicalize().unwrap();
    }
    let p2 = PathBuf::from("../src-tauri/binaries/ffmpeg-aarch64-apple-darwin");
    if p2.exists() {
        return p2.canonicalize().unwrap();
    }
    PathBuf::from("/opt/homebrew/bin/ffmpeg")
}

fn get_ffprobe_bin() -> PathBuf {
    let p = PathBuf::from("binaries/ffprobe-aarch64-apple-darwin");
    if p.exists() {
        return p.canonicalize().unwrap();
    }
    let p2 = PathBuf::from("../src-tauri/binaries/ffprobe-aarch64-apple-darwin");
    if p2.exists() {
        return p2.canonicalize().unwrap();
    }
    PathBuf::from("/opt/homebrew/bin/ffprobe")
}

fn create_sample_files(dir: &Path, ffmpeg: &Path) {
    fs::create_dir_all(dir).unwrap();

    // 1. WAV sintético (3 segundos de tom senoidal)
    let wav_file = dir.join("sample.wav");
    if !wav_file.exists() {
        let status = Command::new(ffmpeg)
            .args(&["-y", "-f", "lavfi", "-i", "sine=frequency=1000:duration=2", "-c:a", "pcm_s16le"])
            .arg(&wav_file)
            .status()
            .unwrap();
        assert!(status.success());
    }

    // 2. MP3 sintético
    let mp3_file = dir.join("sample.mp3");
    if !mp3_file.exists() {
        let status = Command::new(ffmpeg)
            .args(&["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-c:a", "libmp3lame", "-b:a", "192k"])
            .arg(&mp3_file)
            .status()
            .unwrap();
        assert!(status.success());
    }

    // 3. MOV sintético (áudio + vídeo)
    let mov_file = dir.join("sample.mov");
    if !mov_file.exists() {
        let status = Command::new(ffmpeg)
            .args(&[
                "-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=24",
                "-f", "lavfi", "-i", "sine=frequency=600:duration=2",
                "-c:v", "libx264", "-c:a", "aac",
            ])
            .arg(&mov_file)
            .status()
            .unwrap();
        assert!(status.success());
    }

    // 4. MP4 sintético (áudio + vídeo)
    let mp4_file = dir.join("sample.mp4");
    if !mp4_file.exists() {
        let status = Command::new(ffmpeg)
            .args(&[
                "-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=24",
                "-f", "lavfi", "-i", "sine=frequency=800:duration=2",
                "-c:v", "libx264", "-c:a", "aac",
            ])
            .arg(&mp4_file)
            .status()
            .unwrap();
        assert!(status.success());
    }

    // 5. MP3 com capa do álbum embutida (cover art)
    let cover_file = dir.join("sample_cover.png");
    if !cover_file.exists() {
        let status = Command::new(ffmpeg)
            .args(&["-y", "-f", "lavfi", "-i", "color=c=red:s=300x300:d=1", "-frames:v", "1"])
            .arg(&cover_file)
            .status()
            .unwrap();
        assert!(status.success());
    }

    let mp3_cover_file = dir.join("sample_cover.mp3");
    if !mp3_cover_file.exists() {
        let status = Command::new(ffmpeg)
            .args(&[
                "-y", "-i", mp3_file.to_str().unwrap(),
                "-i", cover_file.to_str().unwrap(),
                "-map", "0:a", "-map", "1:v",
                "-c:a", "copy", "-c:v", "mjpeg",
                "-id3v2_version", "3",
                "-metadata:s:v", "title=Album cover",
                "-metadata:s:v", "comment=Cover (front)",
            ])
            .arg(&mp3_cover_file)
            .status()
            .unwrap();
        assert!(status.success());
    }
}

#[test]
fn test_all_conversion_flows() {
    let ffmpeg = get_ffmpeg_bin();
    let ffprobe = get_ffprobe_bin();
    assert!(ffmpeg.exists(), "Binário FFmpeg deve existir");
    assert!(ffprobe.exists(), "Binário FFprobe deve existir");

    let test_dir = std::env::temp_dir().join("fluxconvert_integration_tests");
    let out_dir = test_dir.join("output");
    let _ = fs::remove_dir_all(&test_dir);
    fs::create_dir_all(&out_dir).unwrap();

    create_sample_files(&test_dir, &ffmpeg);

    let wav_sample = test_dir.join("sample.wav");
    let mp3_sample = test_dir.join("sample.mp3");
    let mov_sample = test_dir.join("sample.mov");
    let mp4_sample = test_dir.join("sample.mp4");

    // Fluxo 1: WAV -> MP3 (320kbps)
    println!("Testando WAV -> MP3...");
    let info = probe_file(&ffprobe, &wav_sample).unwrap();
    assert!(info.has_audio);
    let options = ConversionOptions {
        target_format: "mp3".to_string(),
        quality: Some("320".to_string()),
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info));
    let out_path = get_unique_output_path(&out_dir, "test_wav_to_mp3", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let mut last_percent = 0.0;
    let res = run_conversion(
        &ffmpeg,
        &wav_sample,
        &out_path,
        info.duration_seconds,
        &args.args,
        token,
        |p| {
            last_percent = p.percent;
        },
    );
    assert!(res.is_ok());
    assert!(out_path.exists());
    assert!(out_path.metadata().unwrap().len() > 1000);
    assert_eq!(last_percent, 100.0);

    // Fluxo 2: WAV -> FLAC
    println!("Testando WAV -> FLAC...");
    let options = ConversionOptions {
        target_format: "flac".to_string(),
        quality: None,
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info));
    let out_path = get_unique_output_path(&out_dir, "test_wav_to_flac", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &wav_sample,
        &out_path,
        info.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok());
    assert!(out_path.exists());

    // Fluxo 3: MP3 -> WAV (24bit)
    println!("Testando MP3 -> WAV...");
    let info_mp3 = probe_file(&ffprobe, &mp3_sample).unwrap();
    let options = ConversionOptions {
        target_format: "wav".to_string(),
        quality: Some("24bit".to_string()),
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_mp3));
    let out_path = get_unique_output_path(&out_dir, "test_mp3_to_wav", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mp3_sample,
        &out_path,
        info_mp3.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok());
    assert!(out_path.exists());

    // Fluxo 4: MOV -> MP4 (Vídeo equilibrado)
    println!("Testando MOV -> MP4...");
    let info_mov = probe_file(&ffprobe, &mov_sample).unwrap();
    assert!(info_mov.has_video);
    let options = ConversionOptions {
        target_format: "mp4".to_string(),
        quality: Some("balanced".to_string()),
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_mov));
    let out_path = get_unique_output_path(&out_dir, "test_mov_to_mp4", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mov_sample,
        &out_path,
        info_mov.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok());
    assert!(out_path.exists());

    // Fluxo 5: MOV -> MP3 (Extração de áudio de vídeo)
    println!("Testando MOV -> MP3 (extração)...");
    let options = ConversionOptions {
        target_format: "mp3".to_string(),
        quality: Some("320".to_string()),
        extract_audio_only: true,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_mov));
    let out_path = get_unique_output_path(&out_dir, "test_mov_to_mp3", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mov_sample,
        &out_path,
        info_mov.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok());
    assert!(out_path.exists());
    let probed_extracted = probe_file(&ffprobe, &out_path).unwrap();
    assert!(probed_extracted.has_audio);
    assert!(!probed_extracted.has_video); // Vídeo descartado com sucesso

    // Fluxo 6: MP4 -> MP3 (Extração de áudio)
    println!("Testando MP4 -> MP3 (extração)...");
    let info_mp4 = probe_file(&ffprobe, &mp4_sample).unwrap();
    let options = ConversionOptions {
        target_format: "mp3".to_string(),
        quality: Some("256".to_string()),
        extract_audio_only: true,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_mp4));
    let out_path = get_unique_output_path(&out_dir, "test_mp4_to_mp3", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mp4_sample,
        &out_path,
        info_mp4.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok());
    assert!(out_path.exists());

    // Fluxo 7: MP4 -> MOV
    println!("Testando MP4 -> MOV...");
    let options = ConversionOptions {
        target_format: "mov".to_string(),
        quality: Some("balanced".to_string()),
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_mp4));
    let out_path = get_unique_output_path(&out_dir, "test_mp4_to_mov", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mp4_sample,
        &out_path,
        info_mp4.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok());
    assert!(out_path.exists());

    // Fluxo 8: Prevenção de sobrescrita (colisão de nomes)
    println!("Testando colisão de nomes...");
    let p1 = get_unique_output_path(&out_dir, "colisao", "mp3");
    fs::write(&p1, b"original").unwrap();
    let p2 = get_unique_output_path(&out_dir, "colisao", "mp3");
    assert_eq!(p2.file_name().unwrap(), "colisao_2.mp3");
    fs::write(&p2, b"segundo").unwrap();
    let p3 = get_unique_output_path(&out_dir, "colisao", "mp3");
    assert_eq!(p3.file_name().unwrap(), "colisao_3.mp3");

    // Fluxo 9: Múltiplos WAV -> Múltiplos MP3 em lote
    println!("Testando múltiplos arquivos em lote...");
    for i in 1..=3 {
        let input_wav = test_dir.join(format!("batch_{}.wav", i));
        fs::copy(&wav_sample, &input_wav).unwrap();
        let out_mp3 = get_unique_output_path(&out_dir, &format!("batch_{}", i), "mp3");
        let token = Arc::new(AtomicBool::new(false));
        let opt = ConversionOptions {
            target_format: "mp3".to_string(),
            quality: Some("320".to_string()),
            extract_audio_only: false,
        };
        let bargs = build_ffmpeg_args(&opt, &SourceMedia::default());
        let res = run_conversion(&ffmpeg, &input_wav, &out_mp3, 2.0, &bargs.args, token, |_| {});
        assert!(res.is_ok());
        assert!(out_mp3.exists());
    }

    // Fluxo 10: Cancelamento seguro
    println!("Testando cancelamento seguro...");
    let cancel_token = Arc::new(AtomicBool::new(true)); // Já cancelado
    let cancel_out = out_dir.join("should_not_exist.mp3");
    let opt = ConversionOptions {
        target_format: "mp3".to_string(),
        quality: Some("320".to_string()),
        extract_audio_only: false,
    };
    let bargs = build_ffmpeg_args(&opt, &SourceMedia::default());
    let res = run_conversion(&ffmpeg, &wav_sample, &cancel_out, 2.0, &bargs.args, cancel_token, |_| {});
    assert!(res.is_err());
    assert!(!cancel_out.exists(), "Arquivo cancelado não deve permanecer no disco");

    // Fluxo 11: Varredura de pasta com arquivos de mídia
    println!("Testando varredura recursiva de pasta...");
    let subfolder = test_dir.join("subpasta_musicas");
    fs::create_dir_all(&subfolder).unwrap();
    let sub_wav = subfolder.join("musica_interior.wav");
    fs::copy(&wav_sample, &sub_wav).unwrap();

    let mut scanned_count = 0;
    for entry in walkdir::WalkDir::new(&test_dir).into_iter().filter_map(|e| e.ok()) {
        let p = entry.path();
        if p.is_file() {
            if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                if ["wav", "mp3", "mov", "mp4"].contains(&ext.to_lowercase().as_str()) {
                    let probe = probe_file(&ffprobe, p);
                    if probe.is_ok() {
                        scanned_count += 1;
                    }
                }
            }
        }
    }
    assert!(scanned_count >= 5, "Varredura deve ter encontrado pelo menos 5 arquivos de mídia válidos");

    // Fluxo 12: MP3 (só áudio) -> MP4 (vídeo gerado com fundo sólido)
    println!("Testando MP3 -> MP4 (vídeo gerado a partir do áudio)...");
    let info_audio_only = probe_file(&ffprobe, &mp3_sample).unwrap();
    assert!(info_audio_only.has_audio);
    assert!(!info_audio_only.has_video);
    let options = ConversionOptions {
        target_format: "mp4".to_string(),
        quality: Some("balanced".to_string()),
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_audio_only));
    let out_path = get_unique_output_path(&out_dir, "test_mp3_to_mp4", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mp3_sample,
        &out_path,
        info_audio_only.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok(), "Conversão de música para vídeo deve funcionar: {:?}", res.err());
    let probed_generated = probe_file(&ffprobe, &out_path).unwrap();
    assert!(probed_generated.has_video, "A saída deve conter um stream de vídeo");
    assert!(probed_generated.has_audio, "A saída deve manter o áudio");

    // Fluxo 13: MP3 com capa -> MP4 (vídeo gerado a partir da capa do álbum)
    println!("Testando MP3 com capa -> MP4 (vídeo gerado a partir da capa)...");
    let mp3_cover_sample = test_dir.join("sample_cover.mp3");
    let info_cover = probe_file(&ffprobe, &mp3_cover_sample).unwrap();
    assert!(info_cover.has_audio);
    assert!(info_cover.has_cover, "A capa do álbum deve ser detectada");
    assert!(!info_cover.has_video, "Capa não deve contar como vídeo real");
    let options = ConversionOptions {
        target_format: "mp4".to_string(),
        quality: Some("high".to_string()),
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_cover));
    let out_path = get_unique_output_path(&out_dir, "test_cover_to_mp4", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mp3_cover_sample,
        &out_path,
        info_cover.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok(), "Conversão com capa deve funcionar: {:?}", res.err());
    let probed_cover_out = probe_file(&ffprobe, &out_path).unwrap();
    assert!(probed_cover_out.has_video, "A saída deve conter um stream de vídeo");
    assert!(probed_cover_out.has_audio, "A saída deve manter o áudio");

    // Fluxo 14: MP3 com capa -> M4A (capa removida; antes o FFmpeg falhava)
    println!("Testando MP3 com capa -> M4A...");
    let options = ConversionOptions {
        target_format: "m4a".to_string(),
        quality: Some("256".to_string()),
        extract_audio_only: false,
    };
    let args = build_ffmpeg_args(&options, &SourceMedia::from(&info_cover));
    let out_path = get_unique_output_path(&out_dir, "test_cover_to_m4a", &args.output_extension);
    let token = Arc::new(AtomicBool::new(false));
    let res = run_conversion(
        &ffmpeg,
        &mp3_cover_sample,
        &out_path,
        info_cover.duration_seconds,
        &args.args,
        token,
        |_| {},
    );
    assert!(res.is_ok(), "MP3 com capa deve converter para M4A: {:?}", res.err());
    assert!(out_path.exists());

    println!("TODOS OS 14 FLUXOS DE TESTE PASSARAM COM SUCESSO!");
}
