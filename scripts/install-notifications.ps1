# Install Push Notifications Dependencies
# Run this script to install all required packages

Write-Host "📦 Installing Expo Notifications packages..." -ForegroundColor Cyan
Write-Host ""

# Install packages
npx expo install expo-notifications expo-device expo-constants

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your development server (Ctrl+C and run 'npm start')"
Write-Host "2. Test on a PHYSICAL device (notifications don't work on emulators)"
Write-Host "3. Navigate to /test-notifications to test all notification types"
Write-Host ""
Write-Host "📖 For more information, see:" -ForegroundColor Cyan
Write-Host "   - docs/NOTIFICATIONS_SETUP.md"
Write-Host "   - docs/PHASE4_PUSH_NOTIFICATIONS.md"
Write-Host ""
