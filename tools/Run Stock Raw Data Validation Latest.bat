@echo off
setlocal

set "PYTHON_EXE=C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
set "SCRIPT_PATH=C:\Users\User\Documents\Whiskora\tools\validate_stock_cover_monthly_inputs.py"

echo Running Stock Raw Data validation...
echo Report month: latest raw stock file
echo.

"%PYTHON_EXE%" "%SCRIPT_PATH%" --report-month latest

echo.
if errorlevel 1 (
  echo Validation finished with an error. Please check the message above.
) else (
  echo Validation completed successfully.
)
echo.
pause
