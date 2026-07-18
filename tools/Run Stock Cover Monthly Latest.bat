@echo off
setlocal

set "PYTHON_EXE=C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
set "SCRIPT_PATH=C:\Users\User\Documents\Whiskora\tools\run_stock_cover_monthly.py"

echo Running Stock Cover monthly raw data automation...
echo Report month: latest raw stock file
echo.

"%PYTHON_EXE%" "%SCRIPT_PATH%" --report-month latest

echo.
if errorlevel 1 (
  echo Automation finished with an error. Please check the message above.
) else (
  echo Automation completed successfully.
)
echo.
pause
