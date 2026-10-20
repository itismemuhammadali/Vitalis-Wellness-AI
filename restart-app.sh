#!/bin/bash
echo "🧹 Clearing Metro bundler cache..."
rm -rf node_modules/.cache
rm -rf .expo
echo "✅ Cache cleared!"
echo ""
echo "🚀 Please restart your development server with:"
echo "   npx expo start --clear"
