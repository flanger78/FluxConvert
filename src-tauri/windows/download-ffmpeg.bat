@echo off
echo ============================================
echo   FluxConvert - Download FFmpeg Windows
echo ============================================
echo.

set "FF_VERSION=7.1.1"
set "ARCH=x86_64"
set "BUILD=20240503"
set "PKG=ffmpeg-%FF_VERSION%-%ARCH%-gpl-shared-%BUILD%.zip"
set "URL=https://www.gyan.dev/ffmpeg/builds/%PKG%"
set "TEMP_DIR=%~dp0..\.ffmpeg-temp"
set "BIN_DIR=%~dp0..\binaries"

echo [INFO] Versao: %FF_VERSION% | Arquitetura: %ARCH%
echo [INFO] URL: %URL%
echo.

:: Criar diretorios
if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: Download
echo [PASSO 1] Baixando FFmpeg...
echo.
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%URL%' -OutFile '%TEMP_DIR%\%PKG%'"
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao baixar FFmpeg.
    echo Tente manualmente: %URL%
    pause
    exit /b 1
)
echo [OK] Download concluido.

:: Extrair
echo.
echo [PASSO 2] Extraindo...
echo.
powershell -Command "Expand-Archive -Path '%TEMP_DIR%\%PKG%' -DestinationPath '%TEMP_DIR%' -Force"
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao extrair.
    pause
    exit /b 1
)
echo [OK] Extracao concluida.

:: Copiar binarios
echo.
echo [PASSO 3] Copiando binarios...
echo.
for /d %%d in ("%TEMP_DIR%\ffmpeg*") do (
    copy "%%d\bin\ffmpeg.exe" "%BIN_DIR%\ffmpeg.exe" /Y
    copy "%%d\bin\ffprobe.exe" "%BIN_DIR%\ffprobe.exe" /Y
)

if exist "%BIN_DIR%\ffmpeg.exe" (
    echo [OK] ffmpeg.exe copiado para %BIN_DIR%
) else (
    echo [ERRO] ffmpeg.exe nao encontrado apos extracao.
    echo Estrutura esperada: ffmpeg-xxx\bin\ffmpeg.exe
    pause
    exit /b 1
)

if exist "%BIN_DIR%\ffprobe.exe" (
    echo [OK] ffprobe.exe copiado para %BIN_DIR%
) else (
    echo [ERRO] ffprobe.exe nao encontrado apos extracao.
    pause
    exit /b 1
)

:: Verificar
echo.
echo [PASSO 4] Verificando...
echo.
"%BIN_DIR%\ffmpeg.exe" -version | findstr "ffmpeg version"
"%BIN_DIR%\ffprobe.exe" -version | findstr "ffprobe version"

:: Limpar temp
echo.
echo [INFO] Limpando temporario...
rmdir /s /q "%TEMP_DIR%" 2>nul

echo.
echo ============================================
echo   DOWNLOAD CONCLUIDO COM SUCESSO!
echo ============================================
echo.
pause
