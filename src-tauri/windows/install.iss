; FluxConvert - Inno Setup Script
; Este script gera o instalador FluxConvert-Setup.exe

[Setup]
; Basic Setup Information
AppName=FluxConvert
AppVersion=1.0.0
AppPublisher=Fabricio Langer
DefaultDirName={autopf}\FluxConvert
DefaultGroupName=FluxConvert
OutputDir=%~dp0output
OutputBaseFilename=FluxConvert-Setup
Compression=lzma
SolidCompression=yes
SetupIconFile=%~dp0..\icons\icon.ico
; Requer WebView2 Runtime (Windows 10/11 ja incluem; Windows 7/8 baixa automaticamente)
; Nota: o instalador oficial gerado pelo Tauri (NSIS) ja cuida disso automaticamente.

; Modern UI Options
WizardStyle=modern
UninstallDisplayIcon={app}\fluxconvert.exe

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\PortugueseBR.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; FluxConvert Executable (nome do binario vindo do Cargo)
Source: "%~dp0..\target\release\fluxconvert.exe"; DestDir: "{app}"; Flags: ignoreversion
; FFmpeg Binaries (o Tauri usa o nome com sufixo de triple; em runtime o app
; tambem aceita o nome simples ao lado do executavel)
Source: "%~dp0..\binaries\ffmpeg-x86_64-pc-windows-msvc.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "%~dp0..\binaries\ffprobe-x86_64-pc-windows-msvc.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "%~dp0..\binaries\ffmpeg.exe"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "%~dp0..\binaries\ffprobe.exe"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\FluxConvert"; Filename: "{app}\fluxconvert.exe"
Name: "{group}\FluxConvert - Desinstalar"; Filename: "{uninstallexe}"
Name: "{autodesktop}\FluxConvert"; Filename: "{app}\fluxconvert.exe"

[Run]
Filename: "{app}\fluxconvert.exe"; Description: "Executar FluxConvert"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: files; Name: "{app}\*"
Type: rmdir; Name: "{app}"
