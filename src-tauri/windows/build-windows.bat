@echo off
echo ============================================
echo   FluxConvert - Build Completo Windows
echo ============================================
echo.

:: ==================================================
:: PASSO 1: Verificar prerequisites
:: ==================================================
echo [PASSO 1] Verificando prerequisites...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Instale: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js:
node --version

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Rust nao encontrado! Instale: https://rustup.rs
    pause
    exit /b 1
)
echo [OK] Rust:
cargo --version

:: Verificar Visual Studio
echo.
echo Verificando Visual Studio Build Tools...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\VisualStudio\17.0" >nul 2>&1
if %errorlevel% neq 0 (
    reg query "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\17.0" >nul 2>&1
)
if %errorlevel% neq 0 (
    echo [AVISO] Visual Studio Build Tools nao detectado.
    echo Recomendado instalar "Desktop development with C++"
    echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo.
    echo Continuando mesmo assim...
) else (
    echo [OK] Visual Studio Build Tools detectado
)

:: ==================================================
:: PASSO 2: Setup de binarios FFmpeg
:: ==================================================
echo.
echo [PASSO 2] Setup dos binarios FFmpeg...
echo.
call "%~dp0download-ffmpeg.bat"
if %errorlevel% neq 0 (
    echo [AVISO] FFmpeg setup falhou, tentando alternativas...
    echo Tentando via Homebrew (Git Bash)...
    where brew >nul 2>&1
    if %errorlevel% equ 0 (
        brew install ffmpeg
        if exist "/opt/homebrew/bin/ffmpeg" (
            cp /opt/homebrew/bin/ffmpeg "%~dp0..\binaries\ffmpeg.exe"
            cp /opt/homebrew/bin/ffprobe "%~dp0..\binaries\ffprobe.exe"
            echo [OK] FFmpeg copiado via Homebrew
        )
    ) else (
        echo [ERRO] Nao foi possivel obter FFmpeg.
        echo Baixe manualmente de: https://gyan.dev/ffmpeg/builds/
        pause
        exit /b 1
    )
)

:: ==================================================
:: PASSO 3: Instalar dependencias
:: ==================================================
echo.
echo [PASSO 3] Instalando dependencias...
echo.
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] npm install falhou
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

:: ==================================================
:: PASSO 4: Build Tauri (Release)
:: ==================================================
echo.
echo [PASSO 4] Buildando FluxConvert (Release)...
echo Isso pode levar 10-20 minutos na primeira vez.
echo.

call npm run tauri build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Build falhou!
    echo.
    echo Solucoes comuns:
    echo 1. rustup update
    echo 2. Verificar Visual Studio Build Tools
    echo 3. Verificar binarios FFmpeg
    echo 4. Executar: npm run tauri dev (para debug)
    pause
    exit /b 1
)

:: ==================================================
:: PASSO 5: Gerar instalador .exe (opcional)
:: ==================================================
echo.
echo [PASSO 5] Gerando instalador Windows...
echo.

:: Verificar se NSIS esta instalado
where makensis >nul 2>&1
if %errorlevel% equ 0 (
    echo NSIS encontrado. Gerando instalador...
    pushd "%~dp0"
    makensis install.iss
    popd
    if exist "output\FluxConvert-Setup.exe" (
        echo [OK] Instalador gerado: output\FluxConvert-Setup.exe
    ) else (
        echo [AVISO] NSIS executado mas instalador nao encontrado.
        echo O .msi terao tambem disponivel em:
        dir /s /b "..\target\release\bundle\msi\*" 2>nul
    )
) else (
    echo NSIS nao encontrado. O .msi sera gerado automaticamente pelo Tauri.
    echo Para instalador .exe com NSIS:
    echo   1. Baixar NSIS: https://jrsoftware.org/isdl.php
    echo   2. Instalar NSIS
    echo   3. Executar: makensis install.iss
)

:: ==================================================
echo.
echo ============================================
echo   BUILD COMPLETO COM SUCESSO!
echo ============================================
echo.
echo Arquivos gerados:
echo.
echo [APP] FluxConvert.exe:
dir /s /b "..\target\release\bundle\exe\FluxConvert.exe" 2>nul
echo.
echo [MSI] Instalador (.msi):
dir /s /b "..\target\release\bundle\msi\*.msi" 2>nul
echo.
echo [EXE] Instalador (.exe - se NSIS instalado):
dir /s /b "output\FluxConvert-Setup.exe" 2>nul
echo.
echo Para instalar no seu PC:
echo   - Execute o .msi ou .exe gerado
echo   - Ou copie a pasta "binaries\" para a pasta do app
echo.
pause
