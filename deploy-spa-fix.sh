#!/bin/bash

echo "🚀 Deploying SPA Routing Fix for marque.website"
echo "================================================"

# Build the static export
echo "📦 Building static export..."
pnpm build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 FIXES APPLIED:"
    echo "✅ Changed output to 'export' mode"
    echo "✅ Added trailingSlash: true"
    echo "✅ Created _redirects file for SPA routing"
    echo "✅ Updated railway.json for static hosting"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo "1. Commit these changes:"
    echo "   git add ."
    echo "   git commit -m 'Fix SPA routing - handle page reloads'"
    echo "   git push"
    echo ""
    echo "2. Railway will automatically redeploy"
    echo ""
    echo "3. Test the fix:"
    echo "   - Go to https://marque.website/wishlist"
    echo "   - Reload the page (F5 or Ctrl+R)"
    echo "   - Should work without DNS error!"
    echo ""
    echo "🎉 Your SPA routing issue should be fixed!"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
