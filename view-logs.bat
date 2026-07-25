@echo off
chcp 65001 >nul
echo ========================================
echo   查看 weather_proxy 服务日志
echo ========================================
echo.
echo 按 Ctrl+C 停止查看
echo.
powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Select-Object Id, ProcessName, StartTime"
echo.
echo 实时日志输出（如果有的话）：
echo.
powershell -Command "Get-Content 'logs\weather_proxy.log' -Tail 50 -Wait -ErrorAction SilentlyContinue"
