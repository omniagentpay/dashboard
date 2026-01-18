# Gemini API Key Setup & Testing

## Quick Start

### 1. Get Your API Key

Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create a new API key.

### 2. Configure Environment Variables

Create a `.env` file in the `omnipay-agent-dashboard` directory:

```bash
# Required
VITE_GEMINI_API_KEY=your_api_key_here

# Optional - specify which model to use
# Default: gemini-1.5-pro
VITE_GEMINI_MODEL=gemini-1.5-pro
```

### 3. Test Your API Key

Run the test script to verify your API key and see which models you can access:

```bash
npm run test:gemini
```

Or directly:

```bash
node scripts/test-gemini.js
```

You can also pass the API key directly:

```bash
GEMINI_API_KEY=your_key npm run test:gemini
```

## What the Test Script Does

1. **Validates API Key** - Tests basic connection
2. **Lists Available Models** - Tests multiple Gemini models to see which ones your API key can access
3. **Saves Results** - Creates `.gemini-models.json` with accessible models

## Available Models

The script automatically fetches available models from the API and tests them. Your API key has access to **25 models** including:

**Recommended for this project:**
- `gemini-2.5-flash` - Fast, good for function calling (default, recommended)
- `gemini-2.5-pro` - Best for complex function calling
- `gemini-3-pro-preview` - Latest, best capabilities
- `gemini-3-flash-preview` - Latest, fast alternative

**Other available models:**
- `gemini-1.5-pro` - Stable, good for function calling
- `gemini-1.5-flash` - Faster alternative
- `gemini-2.0-flash-exp` - Experimental 2.0 model
- And many more (run the test to see all)

## Model Selection

After running the test, update your `.env` file with an accessible model:

```bash
VITE_GEMINI_MODEL=gemini-1.5-flash  # Use this if 1.5-pro is not available
```

**Recommended Priority:**
1. `gemini-2.5-flash` - Fast, good for function calling (default)
2. `gemini-2.5-pro` - Best for complex function calling
3. `gemini-3-pro-preview` - Latest, best capabilities
4. `gemini-1.5-pro` - Stable fallback
5. Any other accessible model from the test results

## Troubleshooting

### "Model not found" Error

Your API key may not have access to that model. Run the test script to see which models are available.

### "Permission denied" Error

- Check that your API key is correct
- Ensure the API key has not been revoked
- Some models require specific API access levels

### "Quota exceeded" Error

- You've hit your API rate limit
- Wait a few minutes and try again
- Check your Google Cloud Console for quota limits

## Example Output

```
🚀 Gemini API Key Tester

============================================================

🧪 Testing basic API connection...

✅ API Key is valid and working!
📝 Test response: Hello

📋 Testing available models...

   Testing gemini-1.5-pro... ✅ Accessible
   Testing gemini-1.5-flash... ✅ Accessible
   Testing gemini-2.0-flash-exp... ❌ Model not found or not accessible

📊 Summary:
────────────────────────────────────────────────────────────

✅ Accessible Models:
   • gemini-1.5-pro
     Sample response: "Hello"
   • gemini-1.5-flash
     Sample response: "Hello"

💡 Recommended model for this project:
   → gemini-1.5-pro (best for function calling)

💾 Accessible models saved to: .gemini-models.json

✨ Test complete!
```

## Next Steps

1. Run `npm run test:gemini` to verify your setup
2. Update `.env` with the recommended model
3. Restart your dev server: `npm run dev`
4. Open the Agent Chat page and start chatting!
