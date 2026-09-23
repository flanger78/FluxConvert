use std::path::{Path, PathBuf};

/// Retorna um caminho único no diretório de destino, evitando sobrescrita acidental.
/// Se `musica.mp3` já existir, gera `musica_2.mp3`, `musica_3.mp3`, etc.
pub fn get_unique_output_path(target_dir: &Path, file_stem: &str, extension: &str) -> PathBuf {
    let base_name = format!("{}.{}", file_stem, extension);
    let mut target_path = target_dir.join(&base_name);

    if !target_path.exists() {
        return target_path;
    }

    let mut counter = 2;
    loop {
        let candidate_name = format!("{}_{}.{}", file_stem, counter, extension);
        target_path = target_dir.join(&candidate_name);
        if !target_path.exists() {
            return target_path;
        }
        counter += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    #[test]
    fn test_unique_name_generation() {
        let temp_dir = std::env::temp_dir().join("flux_test_collision");
        let _ = std::fs::create_dir_all(&temp_dir);

        let file1 = temp_dir.join("musica.mp3");
        let _ = File::create(&file1);

        let unique = get_unique_output_path(&temp_dir, "musica", "mp3");
        assert_eq!(unique.file_name().unwrap(), "musica_2.mp3");

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
