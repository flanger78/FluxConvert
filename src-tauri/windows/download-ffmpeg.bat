@echo off
echo ============================================
echo   FluxConvert - Download FFmpeg Windows
echo ============================================
echo.

:: FFmpeg release oficial (gyan.dev) - pacote essentials x86_64
:: Nota: URLs "release" do gyan.dev nao existem em .zip - manter o pacote versionado
set "PKG=ffmpeg-8.1.2-essentials_build.zip"
set "URL=https://www.gyan.dev/ffmpeg/builds/packages/%PKG%"
set "TEMP_DIR=%~dp0..\.ffmpeg-temp"
set "BIN_DIR=%~dp0..\binaries"
:: O Tauri exige o sufixo da target triple em binarios externos no Windows
set "TRIPLE=x86_64-pc-windows-msvc"

echo [INFO] Pacote: %PKG%
echo [INFO] URL: %URL%
echo.

:: Criar diretorios
if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: Download
echo [PASSO 1] Baixando FFmpeg...
echo.
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%URL%' -OutFile '%TEMP_DIR%\%PKG%' -UseBasicParsing"
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

:: Copiar binarios (com e sem sufixo da triple - o Tauri usa o com sufixo,
:: os scripts de instalacao e o fallback em runtime usam o nome simples)
echo.
echo [PASSO 3] Copiando binarios...
echo.
for /d %%d in ("%TEMP_DIR%\ffmpeg*") do (
    if exist "%%d\bin\ffmpeg.exe" (
        copy "%%d\bin\ffmpeg.exe" "%BIN_DIR%\ffmpeg-%TRIPLE%.exe" /Y >nul
        copy "%%d\bin\ffmpeg.exe" "%BIN_DIR%\ffmpeg.exe" /Y >nul
    )
    if exist "%%d\bin\ffprobe.exe" (
        copy "%%d\bin\ffprobe.exe" "%BIN_DIR%\ffprobe-%TRIPLE%.exe" /Y >nul
        copy "%%d\bin\ffprobe.exe" "%BIN_DIR%\ffprobe.exe" /Y >nul
    )
)

if exist "%BIN_DIR%\ffmpeg-%TRIPLE%.exe" (
    echo [OK] ffmpeg-%TRIPLE%.exe copiado para %BIN_DIR%
) else (
    echo [ERRO] ffmpeg.exe nao encontrado apos extracao.
    echo Estrutura esperada: ffmpeg-xxx\bin\ffmpeg.exe
    pause
    exit /b 1
)

if exist "%BIN_DIR%\ffprobe-%TRIPLE%.exe" (
    echo [OK] ffprobe-%TRIPLE%.exe copiado para %BIN_DIR%
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
