@echo off
REM Relocation Coach — double-click to start (Windows)
cd /d "%~dp0coach"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org & pause & exit /b 1)
where claude >nul 2>nul || echo [warning] Claude Code not found - AI features will not work until you install it and run "claude" once to log in.
where dotnet >nul 2>nul || echo [warning] .NET SDK not found - "Run tests" will not work until you install the .NET 8 SDK or newer.
if not exist node_modules (
  echo Installing dependencies, first time only...
  call npm install || (pause & exit /b 1)
)
start "" http://localhost:3000
call npm run dev
