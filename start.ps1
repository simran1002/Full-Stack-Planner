param (
    [Parameter()]
    [switch]$BackendOnly,
    
    [Parameter()]
    [switch]$FrontendOnly
)

Write-Host "Starting Task Manager Application..." -ForegroundColor Green

function Start-Backend {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; go run main.go"
    Write-Host "Backend server started at http://localhost:8080" -ForegroundColor Green
}

function Start-Frontend {
    Write-Host "Starting frontend development server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
    Write-Host "Frontend development server started at http://localhost:5173" -ForegroundColor Green
}

if ($FrontendOnly) {
    Start-Frontend
} elseif ($BackendOnly) {
    Start-Backend
} else {
    Start-Backend
    Start-Sleep -Seconds 2  
    Start-Frontend
    
    Start-Sleep -Seconds 3
    Write-Host "Opening application in browser..." -ForegroundColor Magenta
    Start-Process "http://localhost:5173"
}

Write-Host "Task Manager application is now running!" -ForegroundColor Green
Write-Host "Backend running at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Frontend running at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in the respective terminal windows to stop the servers" -ForegroundColor Yellow
