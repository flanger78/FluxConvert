# FluxConvert — Instalador Windows

Este diretório contém tudo necessário para gerar e distribuir o instalador do FluxConvert no Windows 10/11.

## 📋 Pré-requisitos para Build (no Windows)

- **Node.js** 18+ (https://nodejs.org)
- **Rust** com toolchain estável (https://rustup.rs)
- **Visual Studio Build Tools** (para compilar código nativo):
  - Instalar via: `https://visualstudio.microsoft.com/visual-cpp-build-tools/`
  - Selecionar: "Desktop development with C++"

NSIS e WiX (geradores de instalador) são baixados automaticamente pelo Tauri — não precisa instalar nada extra.

## 🚀 Formas de Obter o FluxConvert no Windows

### Opção 1: Instalador pronto via GitHub Actions (Recomendado)
O workflow `.github/workflows/build-windows.yml` roda automaticamente no Windows a cada push na `main`:
- Ir para: **Actions** no repositório GitHub → workflow "Build FluxConvert - Windows"
- Baixar o artifact `fluxconvert-windows` (contém `.exe` NSIS + `.msi`)

Para publicar uma release oficial, crie uma tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
O workflow publica os instaladores automaticamente em **Releases**.

### Opção 2: Build Manual no Windows
```bash
# 1. Clonar o repositório
git clone https://github.com/flanger78/FluxConvert.git
cd FluxConvert

# 2. Executar o script de setup automático
.\src-tauri\windows\setup-windows.bat
```
O script baixa o FFmpeg, instala dependências e roda `npm run tauri build`.

### Opção 3: Build apenas do app
```bash
npm install
.\src-tauri\windows\download-ffmpeg.bat   # uma vez por máquina
npm run tauri build
```

## 📦 Saídas do Build

| Arquivo | Caminho |
|---------|---------|
| Instalador `.exe` (NSIS) | `src-tauri/target/release/bundle/nsis/*-setup.exe` |
| Instalador `.msi` (WiX) | `src-tauri/target/release/bundle/msi/*.msi` |
| Executável solto | `src-tauri/target/release/fluxconvert.exe` |

**Para distribuir:** envie o `.exe` (NSIS) — ele já cuida do WebView2, atalhos, ícone e desinstalação.

## 🎁 O que o Instalador Inclui

- FluxConvert app (Tauri + React) com o ícone oficial
- FFmpeg + FFprobe (x86_64) para conversões
- Atalho no Desktop e no Menu Iniciar
- Instalação por usuário (sem pedir administrador)
- Interface em Português (BR) e Inglês
- Download automático do WebView2 em Windows que não o tenham

## 💚 Programa de Colaboração (Windows apenas)

- A cada **5 músicas convertidas**, o app abre o QR Code Pix lembrando a pessoa de colaborar.
- Se ela colaborar (abrir o link Pix ou clicar em "Já colaborei ❤️"), o lembrete **nunca mais aparece**.
- No lugar do botão "Apoiar", fica um badge **"Colaborador ❤️"** no cantinho da tela.
- Esse comportamento é **exclusivo do Windows** — a versão macOS não exibe os lembretes.

## 🗂️ Estrutura de Arquivos

```
src-tauri/windows/
├── README.md              ← Este arquivo
├── setup-windows.bat      ← Setup completo automático (primeira vez)
├── download-ffmpeg.bat    ← Download dos binários FFmpeg x86_64
├── install.iss            ← Script Inno Setup (opcional, alternativo ao NSIS)
└── build-windows.bat      ← Build com verificações detalhadas
```

## 🔧 Solução de Problemas

| Problema | Solução |
|----------|---------|
| "FFmpeg não encontrado" | Executar `download-ffmpeg.bat` para baixar os binários |
| "Erro de compilação Rust" | Instalar Visual Studio Build Tools com C++ |
| "resource path doesn't exist" | Os binários precisam do sufixo `-x86_64-pc-windows-msvc.exe` (o script já gera) |
| "WebView2 não encontrado" | O instalador NSIS baixa automaticamente, ou instale: https://developer.microsoft.com/microsoft-edge/webview2/ |
| "Permission denied" | Rodar terminal como Administrador |
