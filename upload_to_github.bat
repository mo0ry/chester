@echo off
echo Starting Git upload process...

:: تنظیم مسیر پوشه پروژه
set PROJECT_DIR=D:\xampp\htdocs\Chester old\3
:: لینک مخزن GitHub
set REPO_URL=https://github.com/mo0ry/chester.git
:: نام کاربری GitHub
set GITHUB_USERNAME=mo0ry
:: توکن GitHub (جایگزین کنید با توکن جدید)
::set GITHUB_TOKEN=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

:: رفتن به پوشه پروژه
cd /d %PROJECT_DIR%
if errorlevel 1 (
    echo Error: Could not find project directory %PROJECT_DIR%
    pause
    exit /b
)

:: بررسی وجود Git
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed. Please install Git from https://git-scm.com
    pause
    exit /b
)

:: تنظیم اطلاعات کاربر Git
git config --global user.name "%GITHUB_USERNAME%"
git config --global user.email "mooryperisan@gmail.com"

:: بررسی وجود مخزن Git
if not exist .git (
    git init
) else (
    echo Git repository already initialized
)

:: اضافه کردن فایل‌ها
git add .
if errorlevel 1 (
    echo Error: Failed to add files
    pause
    exit /b
)

:: بررسی تغییرات
git status
echo Checking for changes...
git diff --cached --quiet
if %ERRORLEVEL% equ 0 (
    echo No changes to commit. Proceeding to push...
) else (
    git commit -m "Update PHP project files"
    if errorlevel 1 (
        echo Error: Failed to commit changes
        pause
        exit /b
    )
)

:: اطمینان از بودن در شاخه master
git checkout master
if errorlevel 1 (
    echo Error: Could not switch to master branch. Creating master...
    git checkout -b master
)

:: آپلود به GitHub
git push -u origin master
if errorlevel 1 (
    echo Error: Failed to push to GitHub. Check your credentials or network.
    pause
    exit /b
)

echo Success: Project uploaded to %REPO_URL%
pause