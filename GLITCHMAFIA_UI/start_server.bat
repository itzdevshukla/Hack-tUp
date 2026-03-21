@echo off
echo Setting up environment variables...
SET PATH=C:\Program Files\nodejs;%PATH%

echo Starting Glitchmafia Development Server...
echo.
echo Once the server starts, open the Local URL in your browser (usually http://localhost:5173)
echo.

npm run dev
pause
