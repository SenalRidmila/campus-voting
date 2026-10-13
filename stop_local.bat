@echo off
echo Stopping Campus Voting App local services (Ports 3000, 3001, 8000, 8545)...
for %%p in (3000 3001 8000 8545) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        echo Killing process %%a on port %%p...
        taskkill /F /PID %%a 2>nul
    )
)
echo Done! All services stopped.
pause
