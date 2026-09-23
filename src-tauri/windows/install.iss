; FluxConvert - Inno Setup Script
; Este script gera o instalador FluxConvert-Setup.exe

[Setup]
; Basic Setup Information
AppName=FluxConvert
AppVersion=1.0.0
AppPublisher=Fabricio
DefaultDirName={autopf}\FluxConvert
DefaultGroupName=FluxConvert
OutputDir=%~dp0output
OutputBaseFilename=FluxConvert-Setup
Compression=lzma
SolidCompression=yes
SetupIconFile=%~dp0..\icons\icon.ico

; Modern UI Options
WizardStyle=modern
UninstallDisplayIcon={app}\FluxConvert.exe

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\Portuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; FluxConvert Executable
Source: "%~dp0..\target\release\bundle\exe\FluxConvert.exe"; DestDir: "{app}"; Flags: ignoreversion
; FFmpeg Binaries
Source: "%~dp0..\binaries\ffmpeg.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "%~dp0..\binaries\ffprobe.exe"; DestDir: "{app}"; Flags: ignoreversion
; DLLs e dependencias do bundle (se existirem)
Source: "%~dp0..\target\release\bundle\exe\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\FluxConvert"; Filename: "{app}\FluxConvert.exe"
Name: "{group}\FluxConvert - Desinstalar"; Filename: "{uninstallexe}"
Name: "{autodesktop}\FluxConvert"; Filename: "{app}\FluxConvert.exe"

[Run]
Filename: "{app}\FluxConvert.exe"; Description: "Executar FluxConvert"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: files; Name: "{app}\*"
Type: rmdir; Name: "{app}"
