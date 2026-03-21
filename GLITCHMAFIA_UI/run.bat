@echo off
TITLE Glitchmafia Server
COLOR 0A
CLS

ECHO ==========================================
ECHO      GLITCHMAFIA CTF PLATFORM
ECHO ==========================================
ECHO.
ECHO [1/3] Setting up environment...

:: Set Node path explicitly
SET "NODE_HOME=C:\Program Files\nodejs"
SET "PATH=%NODE_HOME%;%PATH%"

ECHO [2/3] Verifying Node.js...
IF EXIST "%NODE_HOME%\node.exe" (
    ECHO    Found Node.js at %NODE_HOME%
    "%NODE_HOME%\node.exe" -v
) ELSE (
    ECHO    ERROR: Node.js not found at %NODE_HOME%
    ECHO    Please install Node.js manually.
    PAUSE
    EXIT /B
)

ECHO.
ECHO [3/3] Starting Development Server...
ECHO    Open the link below in your browser once it appears.
ECHO.

CALL "%NODE_HOME%\npm.cmd" run dev

PAUSE
