@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ================================================================
:: generate_lesson.bat — Arabic Interactive Lessons
:: انقر مرتين لتشغيله — لا تحتاج أي إعداد إضافي
:: ================================================================

:: ── المسارات ─────────────────────────────────────────────────────
set SCRIPT_DIR=%~dp0
set RAW=%SCRIPT_DIR%data\lesson_raw.js
set CLEAN=%SCRIPT_DIR%data\lesson_clean.js
set FINAL=%SCRIPT_DIR%data\lesson.js
set BACKUP=%SCRIPT_DIR%data\lesson_backup.js
set SANITIZE=%SCRIPT_DIR%sanitize_lesson.js
set VALIDATE=%SCRIPT_DIR%validate_lesson.js

cls
echo.
echo  ================================================================
echo   Arabic Interactive Lessons ^— Lesson Publisher
echo   نشر درس جديد
echo  ================================================================
echo.

:: ── التحقق من Node.js ─────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js غير مثبت
    echo.
    echo  الحل: حمل Node.js من https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: ── التحقق من الملفات ────────────────────────────────────────────
if not exist "%RAW%" (
    echo  [ERROR] الملف غير موجود: data\lesson_raw.js
    echo.
    echo  الحل: احفظ ملف الدرس الجديد باسم lesson_raw.js داخل مجلد data\
    echo.
    pause
    exit /b 1
)

if not exist "%SANITIZE%" (
    echo  [ERROR] ملف مفقود: sanitize_lesson.js
    pause
    exit /b 1
)

if not exist "%VALIDATE%" (
    echo  [ERROR] ملف مفقود: validate_lesson.js
    pause
    exit /b 1
)

echo  المدخل : data\lesson_raw.js
echo  الناتج : data\lesson.js
echo.

:: ── STEP 1: Sanitize ──────────────────────────────────────────────
echo  [1/3] تنظيف الملف...
echo.

node "%SANITIZE%" "%RAW%" "%CLEAN%"
set SANITIZE_EXIT=%errorlevel%
echo.

if %SANITIZE_EXIT% neq 0 (
    echo  ================================================================
    echo   STOP - الملف يحتاج مراجعة يدوية
    echo  ================================================================
    echo.
    echo  الحل: افتح data\lesson_raw.js وأصلح المشاكل المذكورة أعلاه
    echo.
    if exist "%CLEAN%" del "%CLEAN%"
    pause
    exit /b 1
)

:: ── STEP 2: Validate ──────────────────────────────────────────────
echo  [2/3] التحقق من البنية والمحتوى...
echo.

node "%VALIDATE%" "%CLEAN%"
set VALIDATE_EXIT=%errorlevel%
echo.

if %VALIDATE_EXIT% neq 0 (
    echo  ================================================================
    echo   STOP - الدرس يحتوي اخطاء تمنع النشر
    echo  ================================================================
    echo.
    echo  الحل: اعد توليد الدرس بعد تصحيح الاخطاء المذكورة اعلاه
    echo.
    if exist "%CLEAN%" del "%CLEAN%"
    pause
    exit /b 1
)

:: ── STEP 3: Publish ───────────────────────────────────────────────
echo  [3/3] نشر الدرس...
echo.

if exist "%FINAL%" (
    copy "%FINAL%" "%BACKUP%" >nul
    echo  [backup] نسخة احتياطية: data\lesson_backup.js
)

copy "%CLEAN%" "%FINAL%" >nul
set COPY_EXIT=%errorlevel%

if exist "%CLEAN%" del "%CLEAN%"

if %COPY_EXIT% neq 0 (
    echo  [ERROR] فشل نسخ الملف
    pause
    exit /b 1
)

:: ── النجاح ────────────────────────────────────────────────────────
echo.
echo  ================================================================
echo.
echo   تم النشر بنجاح!
echo.
echo   الدرس جاهز في: data\lesson.js
echo.
echo   افتح الدرس.html في المتصفح
echo.
echo  ================================================================
echo.
pause
exit /b 0
