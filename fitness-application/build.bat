@echo off
setlocal
set SRC=src
set OUT=out
if not exist "%OUT%" mkdir "%OUT%"
javac -d "%OUT%" %SRC%\com\example\fitness\*.java
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)
echo Build succeeded. Output in %OUT%

