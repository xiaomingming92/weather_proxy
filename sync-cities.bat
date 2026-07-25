@echo off
chcp 65001 >nul
echo ========================================
echo   手动同步 ZTE 城市列表到数据库
echo ========================================
echo.

echo 正在从和风天气 API 同步城市数据...
echo 这可能需要几分钟时间...
echo.

powershell -Command "cd 'c:\Users\Administrator\StudioProjects\htc-marvel-workspace\weather_proxy'; node -e \"require('./dist/services/zte/city-sync.js').default.syncCityListFromAPI().then(count => console.log('同步完成！共同步', count, '个城市')).catch(err => console.error('同步失败:', err))\""

echo.
echo 同步完成！
echo.
echo 测试城市列表：
echo   curl http://localhost:80/zte/getweatheru.asmx/getStationList -d "flag=allcity"
echo.

pause
