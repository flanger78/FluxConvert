@echo off
echo ============================================
echo   FluxConvert - Setup Automatizado Windows
echo ============================================
echo.

:: ==================================================
:: PASSO 1: Verificar prerequisites
:: ==================================================
echo [PASSO 1] Verificando prerequisites...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Baixe e instale: https://nodejs.org (versao 18+)
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js:
node --version

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Rust nao encontrado!
    echo Instale via: https://rustup.rs
    echo.
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
    echo Deseja continuar mesmo assim? (S/N)
    set /p CONTINUE=
    if /i not "%CONTINUE%"=="S" (
        echo Cancelado.
        pause
        exit /b 1
    )
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
    echo [ERRO] FFmpeg setup falhou.
    pause
    exit /b 1
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
    echo.
    pause
    exit /b 1
)

:: ==================================================
:: CONCLUSAO
:: ==================================================
echo.
echo ============================================
echo   SETUP COMPLETO COM SUCESSO!
echo ============================================
echo.
echo Arquivos gerados:
echo.
echo [EXE] Instalador NSIS (.exe):
dir /s /b "%~dp0..\target\release\bundle\nsis\*.exe" 2>nul
echo.
echo [MSI] Instalador (.msi):
dir /s /b "%~dp0..\target\release\bundle\msi\*.msi" 2>nul
echo.
echo Para distribuir:
echo   - Envie o .exe (NSIS) ou .msi gerado
echo.
pause
