@echo off
echo ========================================================
echo  Starting Campus Voting App (Local Multi-Service)
echo ========================================================

echo [1/4] Starting Blockchain Node...
start "Blockchain Node" cmd /k "cd /d "%~dp0blockchain" && npx hardhat node"

echo Waiting 4 seconds for Blockchain node to initialize...
timeout /t 4 /nobreak >nul

echo Deploying Smart Contracts...
cd /d "%~dp0blockchain"
call npx hardhat run scripts/deploy.ts --network localhost

echo [2/4] Starting AI Face Recognition Microservice...
start "AI Microservice" cmd /k "cd /d "%~dp0ai-microservice" && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo [3/4] Starting NestJS Backend...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm run start:dev"

echo [4/4] Starting Next.js Frontend...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ========================================================
echo All 4 services are starting in separate windows:
echo - Frontend:    http://localhost:3000
echo - Backend:     http://localhost:3001
echo - AI Service:  http://localhost:8000
echo - Blockchain:  http://localhost:8545
echo ========================================================
pause
