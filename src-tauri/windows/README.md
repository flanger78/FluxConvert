# FluxConvert — Instalador Windows

Este diretório contém tudo necessário para gerar e executar o instalador do FluxConvert no Windows.

## 📋 Pré-requisitos para Build (no Windows)

- **Node.js** 18+ (https://nodejs.org)
- **Rust** com toolchain estável (https://rustup.rs)
- **Visual Studio Build Tools** (para compilar código nativo):
  - Instalar via: `https://visualstudio.microsoft.com/visual-cpp-build-tools/`
  - Selecionar: "Desktop development with C++"
- **NSIS** (para gerar instalador .exe):
  - https://nsis.sourceforge.io/Download
  - Ou o Tauri gera automaticamente .msi sem NSIS

## 🚀 Formas de Obter o FluxConvert no Windows

### Opção 1: Instalador Pronto (Recomendado)
Se já existir uma build no GitHub Actions, baixe o artifact `.msi` ou `.exe` da última release:
- Ir para: `Releases` no repositório GitHub
- Baixar: `FluxConvert-Windows-Installer.msi` ou `FluxConvert-Setup.exe`

### Opção 2: Build Manual no Windows
```bash
# 1. Clonar o repositório
git clone https://github.com/usuario/fluxconvert.git
cd fluxconvert

# 2. Executar o script de setup automático
.\src-tauri\windows\setup-windows.bat

# 3. Buildar o instalador
npm run tauri build
```

### Opção 3: Build via GitHub Actions (Cross-platform)
O workflow `.github/workflows/build-windows.yml` faz o build automático no Windows:
- Push na branch `main` dispara automaticamente
- Artifacts ficam disponíveis em Actions → "Windows Build"

## 📦 O que o Instalador Inclui

- FluxConvert app (Tauri + React)
- FFmpeg binário (x86_64) para conversões
- FFprobe binário (x86_64) para inspeção de mídia
- Atalho no Desktop (opcional)
- Associação de arquivos de mídia (opcional)
- Entrada no menu Iniciar

## 🗂️ Estrutura de Arquivos

```
src-tauri/windows/
├── README.md              ← Este arquivo
├── setup-windows.bat      ← Script de setup automático
├── download-ffmpeg.bat    ← Download dos binários FFmpeg
├── install.iss            ← Script Inno Setup (para .exe instalador)
└── build-windows.bat      ← Script completo de build
```

## 🔧 Solução de Problemas

| Problema | Solução |
|----------|---------|
| "FFmpeg não encontrado" | Executar `setup-windows.bat` para baixar binários |
| "Erro de compilação Rust" | Instalar Visual Studio Build Tools com C++ |
| "NSIS não encontrado" | Instalar NSIS ou usar .msi ao invés de .exe |
| "Permission denied" | Rodar terminal como Administrador |
