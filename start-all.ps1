# Quick Start Script for LearnBuddy
# This script starts all required services in sequence

Write-Host "🚀 LearnBuddy - Quick Start Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Step 1: Create virtual environment if not exists
if (!(Test-Path "backend\venv")) {
    Write-Host "`n📦 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv backend\venv
}

# Step 2: Activate virtual environment
Write-Host "`n✓ Activating virtual environment..." -ForegroundColor Green
& backend\venv\Scripts\Activate.ps1

# Step 3: Install dependencies
Write-Host "`n📥 Installing Python dependencies..." -ForegroundColor Yellow
pip install --upgrade pip -q
pip install -r backend\app\requirements.txt -q

# Step 4: Check .env file
if (!(Test-Path "backend\app\.env")) {
    Write-Host "`n⚠️  .env file not found!" -ForegroundColor Red
    Write-Host "Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\app\.env.example" "backend\app\.env"
    Write-Host "📝 Please edit backend\app\.env with your credentials before continuing" -ForegroundColor Yellow
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Step 5: Check Redis
Write-Host "`n🔴 Checking Redis..." -ForegroundColor Yellow
try {
    $redisCheck = redis-cli ping 2>$null
    if ($redisCheck -eq "PONG") {
        Write-Host "✓ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis is not running. Please start Redis:" -ForegroundColor Red
        Write-Host "   Windows: redis-server.exe" -ForegroundColor Gray
        Write-Host "   WSL: wsl -- redis-server" -ForegroundColor Gray
        Write-Host "Press any key to continue anyway..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
} catch {
    Write-Host "⚠️  Redis check failed. Make sure Redis is running." -ForegroundColor Yellow
}

# Step 6: Create MySQL database
Write-Host "`n🗄️  Setting up MySQL database..." -ForegroundColor Yellow
Write-Host "Make sure XAMPP MySQL is running!" -ForegroundColor Yellow
Write-Host "Creating database if it doesn't exist..." -ForegroundColor Gray

# You can automate this with mysql command if installed, otherwise manual
Write-Host "Open http://localhost/phpmyadmin and create database 'learnbuddy' if needed" -ForegroundColor Cyan

# Step 7: Start services
Write-Host "`n🚀 Starting all services..." -ForegroundColor Green

Write-Host "`n📌 Opening services in separate terminals..." -ForegroundColor Yellow

# Backend API
Write-Host "   → Starting FastAPI backend..." -ForegroundColor Cyan
$fastapi = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -PassThru

Start-Sleep -Seconds 2

# Celery Worker
Write-Host "   → Starting Celery worker..." -ForegroundColor Cyan
$celery = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; venv\Scripts\Activate.ps1; celery -A app.tasks.celery_app worker --loglevel=info" -PassThru

Start-Sleep -Seconds 2

# Frontend (if node_modules exists)
if (Test-Path "node_modules") {
    Write-Host "   → Starting frontend dev server..." -ForegroundColor Cyan
    $frontend = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev" -PassThru
} else {
    Write-Host "`n⚠️  node_modules not found. Install frontend dependencies first:" -ForegroundColor Yellow
    Write-Host "   npm install" -ForegroundColor Gray
}

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "`n📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:      http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API:   http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:      http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Health Check:  http://localhost:8000/health" -ForegroundColor White

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Create a new database 'learnbuddy' in phpMyAdmin" -ForegroundColor Gray
Write-Host "   2. Test health endpoint: curl http://localhost:8000/health" -ForegroundColor Gray
Write-Host "   3. Sign up and login at http://localhost:5173" -ForegroundColor Gray
Write-Host "   4. Upload a PDF to test the full flow" -ForegroundColor Gray

Write-Host "`n⚠️  To stop all services, close each terminal window." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Green
