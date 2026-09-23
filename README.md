# FluxConvert ⚡️

Aplicativo desktop moderno, limpo e extremamente fácil de usar para conversão de arquivos de áudio e vídeo em lote, 100% offline, com **FFmpeg** e **FFprobe** empacotados diretamente no aplicativo.

---

## 🚀 Como Executar em Modo de Desenvolvimento

```bash
# 1. Carregar variáveis do compilador Rust (instalado via rustup)
source $HOME/.cargo/env

# 2. Iniciar o aplicativo desktop com hot-reload
npm run tauri dev
```

---

## 📦 Como Gerar o Instalador Final para macOS (.app e .dmg)

```bash
source $HOME/.cargo/env
npm run tauri build
```

Os arquivos finais estarão localizados em:
* **Aplicativo (.app):** `src-tauri/target/release/bundle/macos/FluxConvert.app`
* **Instalador (.dmg):** `src-tauri/target/release/bundle/dmg/FluxConvert_1.0.0_aarch64.dmg`

---

## 🧪 Como Executar os Testes de Conversão Real

Para validar todos os 11 fluxos de conversão de mídia com o FFmpeg empacotado:
```bash
source $HOME/.cargo/env
cd src-tauri && cargo test --test conversion_tests -- --nocapture
```

---

## ✨ Recursos Implementados

1. **Drag and drop:** Arraste um arquivo, vários arquivos ou uma pasta inteira.
2. **Seleção de arquivos e pastas:** Botões dedicados com navegação nativa do macOS.
3. **Formatos de Áudio:** MP3, WAV, FLAC, M4A/AAC, OGG, OPUS.
4. **Formatos de Vídeo:** MP4, MOV, MKV, WebM.
5. **Extração de Áudio de Vídeos:** Converte vídeo para qualquer formato de áudio (ex: MOV $\to$ MP3, MP4 $\to$ WAV).
6. **Presets de Qualidade Simples:**
   * MP3: 320 kbps (Padrão), 256 kbps, 192 kbps, 128 kbps.
   * WAV: 24-bit (Padrão), 16-bit.
   * FLAC: Lossless.
   * Vídeo: Alta qualidade, Equilibrado, Arquivo menor.
7. **Pasta de Destino:** Mesma pasta do arquivo original ou escolha de pasta personalizada.
8. **Segurança de Nomes:** Evita sobrescrever arquivos existentes gerando `_2`, `_3`, etc. Nunca apaga os originais.
9. **Barra de Progresso e Cancelamento:** Acompanhamento do arquivo atual, porcentagem geral e botão para cancelar a qualquer momento.
10. **Botão Abrir Pasta:** Revela os arquivos convertidos diretamente no Finder do macOS.
11. **Totalmente Offline:** Nenhum arquivo é enviado para servidores externos.

---

## 🪟 Windows

### Pré-requisitos
- Node.js 18+: [nodejs.org](https://nodejs.org)
- Rust: [rustup.rs](https://rustup.rs)
- Visual Studio Build Tools (C++): [visualstudio.microsoft.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Build no Windows
```bash
# Script automático (recomendado)
.\src-tauri\windows\setup-windows.bat

# Ou manualmente
npm install
npm run tauri build
```

### Instalador
O build gera automaticamente `FluxConvert-Setup.msi` em `src-tauri/target/release/bundle/msi/`.
Para instalador `.exe`, instale [NSIS](https://nsis.sourceforge.io/) e execute:
```bash
makensis src-tauri/windows/install.iss
```

### Scripts Disponíveis
| Script | Descrição |
|--------|-----------|
| `setup-windows.bat` | Verifica prerequisites e faz build completo |
| `build-windows.bat` | Build com verificação de Visual Studio e FFmpeg |
| `download-ffmpeg.bat` | Baixa binários FFmpeg x86_64 Windows |
| `install.iss` | Script Inno Setup para instalador .exe |

### GitHub Actions
Build automático no Windows via `.github/workflows/build-windows.yml`.
Push na branch `main` dispara builds automáticas.
