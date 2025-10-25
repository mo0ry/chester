@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

title Project Structure Analyzer

echo ===============================================
echo    PROJECT STRUCTURE ANALYZER
echo ===============================================
echo.

:: انتخاب پوشه مورد نظر برای تحلیل
set /p "target_dir=Enter the project directory path (or press Enter for current directory): "

if "!target_dir!"=="" (
    set "target_dir=."
    echo Analyzing CURRENT directory...
) else (
    if not exist "!target_dir!\" (
        echo ERROR: Directory does not exist!
        pause
        exit /b 1
    )
    echo Analyzing directory: !target_dir!
)

:: تغییر به پوشه هدف اگر متفاوت از پوشه جاری است
if not "!target_dir!"=="." (
    pushd "!target_dir!"
)

echo.
echo Generating filtered project structure...
echo.

:: پاک کردن فایل‌های قبلی
for %%f in (project_structure.txt file_list.txt project_info.txt temp_tree.txt) do (
    if exist "%%f" del "%%f"
)

:: ایجاد ساختار درختی فیلتر شده
echo [1/3] Creating tree structure...
tree /f /a > temp_tree.txt

:: فیلتر کردن پیشرفته‌تر
findstr /v /i "\\node_modules\\ \\vendor\\ \\cache\\ \\tmp\\ \\temp\\ \\logs\\ \\backup\\ \\zip\\ \\help\\ \.bat$ \.txt$ \.zip$ \.log$ \.tmp$ \.cache$" temp_tree.txt > project_structure.txt

:: لیست فایل‌های مفید
echo [2/3] Generating file list...
dir /s /b | findstr /v /i "\\node_modules\\ \\vendor\\ \\cache\\ \\tmp\\ \\temp\\ \\logs\\ \\backup\\ \\zip\\ \\help\\ \.bat$ \.txt$ \.zip$ \.log$ \.tmp$ \.cache$" > file_list.txt

:: تحلیل پروژه
echo [3/3] Analyzing project structure...

:: شروع ایجاد فایل اطلاعات پروژه
(
echo ===============================================
echo    PROJECT STRUCTURE ANALYSIS REPORT
echo ===============================================
echo Generated: %date% %time%
echo Project Path: %cd%
echo.
echo === PROJECT SUMMARY ===
echo.
) > project_info.txt

:: شمارش فایل‌ها و پوشه‌ها
echo Counting files and directories...
for /f "tokens=3" %%a in ('dir /a-d /s ^| find "File(s)"') do set file_count=%%a
for /f "tokens=2" %%a in ('dir /ad /s ^| find "Dir(s)"') do set dir_count=%%a

:: تحلیل انواع فایل‌ها
echo Analyzing file types...
(
echo Total Directories: !dir_count!
echo Total Files: !file_count!
echo.
echo === FILE TYPE ANALYSIS ===
echo.
) >> project_info.txt

:: تحلیل فایل‌های PHP
set php_count=0
for /f %%a in ('dir /s /b *.php 2^>nul ^| find /c /v ""') do set php_count=%%a
echo PHP files: !php_count! >> project_info.txt

:: تحلیل فایل‌های JavaScript
set js_count=0
for /f %%a in ('dir /s /b *.js 2^>nul ^| find /c /v ""') do set js_count=%%a
echo JavaScript files: !js_count! >> project_info.txt

:: تحلیل فایل‌های CSS
set css_count=0
for /f %%a in ('dir /s /b *.css 2^>nul ^| find /c /v ""') do set css_count=%%a
echo CSS files: !css_count! >> project_info.txt

:: تحلیل فایل‌های HTML
set html_count=0
for /f %%a in ('dir /s /b *.html 2^>nul ^| find /c /v ""') do set html_count=%%a
echo HTML files: !html_count! >> project_info.txt

:: تحلیل فایل‌های JSON
set json_count=0
for /f %%a in ('dir /s /b *.json 2^>nul ^| find /c /v ""') do set json_count=%%a
echo JSON files: !json_count! >> project_info.txt

(
echo.
echo === DIRECTORY STRUCTURE ANALYSIS ===
echo.
) >> project_info.txt

:: بررسی دایرکتوری‌های مهم
for %%d in (
    api library js css config database admin include src 
    public private models controllers views templates
    assets images styles scripts
) do (
    if exist "%%d\" (
        echo [✓] %%d/ directory found >> project_info.txt
        echo   Contents: >> project_info.txt
        set "dir_has_files=0"
        for /f "delims=" %%i in ('dir "%%d\" /b 2^>nul ^| findstr /v "\.\.\?$"') do (
            set "dir_has_files=1"
            echo     - %%i >> project_info.txt
        )
        if !dir_has_files!==0 (
            echo     (empty directory) >> project_info.txt
        )
    ) else (
        echo [✗] %%d/ directory not found >> project_info.txt
    )
)

:: بررسی فایل‌های مهم خاص
(
echo.
echo === KEY FILES ANALYSIS ===
echo.
) >> project_info.txt

for %%f in (
    index.php index.html composer.json package.json 
    README.md README.txt .gitignore config.php
    database.php settings.ini
) do (
    if exist "%%f" (
        echo [✓] %%f >> project_info.txt
    ) else (
        echo [✗] %%f >> project_info.txt
    )
)

:: بررسی فایل‌های PHP مهم به صورت بازگشتی
(
echo.
echo === IMPORTANT PHP FILES ===
echo.
) >> project_info.txt

set "important_php_found=0"
for /r %%f in (*.php) do (
    for %%i in (
        user manager auth login config database 
        admin api controller model view
    ) do (
        echo %%f | findstr /i "%%i" >nul && (
            echo [IMPORTANT] %%f >> project_info.txt
            set "important_php_found=1"
        )
    )
)

if !important_php_found!==0 (
    echo No important PHP files detected automatically. >> project_info.txt
)

:: بررسی فایل‌های JavaScript مهم
(
echo.
echo === IMPORTANT JAVASCRIPT FILES ===
echo.
) >> project_info.txt

set "important_js_found=0"
for /r %%f in (*.js) do (
    for %%i in (
        auth login user app main config 
        admin api utility utils common
    ) do (
        echo %%f | findstr /i "%%i" >nul && (
            echo [IMPORTANT] %%f >> project_info.txt
            set "important_js_found=1"
        )
    )
)

if !important_js_found!==0 (
    echo No important JavaScript files detected automatically. >> project_info.txt
)

:: اطلاعات سیستم و محیط
(
echo.
echo === SYSTEM INFORMATION ===
echo.
echo Script Version: 2.0
echo Current Directory: %cd%
echo Script Directory: %~dp0
echo.
) >> project_info.txt

:: خلاصه نهایی
(
echo ===============================================
echo              ANALYSIS COMPLETE
echo ===============================================
echo.
echo 📊 GENERATED REPORTS:
echo.
echo 📄 project_structure.txt - Filtered directory tree
echo 📄 file_list.txt - List of all relevant files  
echo 📄 project_info.txt - Detailed project analysis
echo.
echo 🔍 RECOMMENDED FILES TO REVIEW:
echo.
) >> project_info.txt

:: پیشنهاد فایل‌های مهم برای بررسی
if exist "library\user_manager.php" echo   library\user_manager.php >> project_info.txt
if exist "api\get_users.php" echo   api\get_users.php >> project_info.txt  
if exist "js\auth.js" echo   js\auth.js >> project_info.txt
if exist "config\database.php" echo   config\database.php >> project_info.txt
if exist "index.php" echo   index.php >> project_info.txt

:: تمیزکاری
if exist "temp_tree.txt" del "temp_tree.txt"

:: بازگشت به پوشه اصلی اگر تغییر کرده بود
if not "!target_dir!"=="." (
    popd
)

:: نمایش نتیجه نهایی
echo.
echo ===============================================
echo ✅ ANALYSIS COMPLETED SUCCESSFULLY!
echo ===============================================
echo.
echo 📁 Generated reports in: %cd%
echo.
echo 📋 Files created:
echo    ✅ project_structure.txt - Directory tree (filtered)
echo    ✅ file_list.txt - All project files (filtered)
echo    ✅ project_info.txt - Complete project analysis
echo.
echo 📝 Next steps:
echo    1. Send the generated files for code analysis
echo    2. Review project_info.txt for key findings
echo    3. Check file_list.txt for complete file inventory
echo.
echo Press any key to exit...
pause >nul