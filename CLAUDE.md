# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Read-Anything is a Chrome browser extension that reads aloud any text you select on a webpage. It's a simple text-to-speech extension with automatic language detection.

## Architecture

This is a minimal Chrome extension with:
- `manifest.json` - Extension manifest (version 3) that defines permissions and content script injection
- `content.js` - Content script injected into all web pages that handles text selection and speech synthesis
- No build process or dependencies - pure JavaScript

## Key Components

- **Selection Detection**: Uses `mouseup` event listener to detect when user finishes selecting text
- **Speech Synthesis**: Uses browser's native `SpeechSynthesisUtterance` API for text-to-speech
- **Auto-cancellation**: Stops previous speech when new text is selected

## Installation and Testing

Since this is a Chrome extension without a build process:

1. Load extension in Chrome: Navigate to `chrome://extensions`, enable Developer Mode, click "Load unpacked" and select the project directory
2. Test by selecting text on any webpage - it should automatically read aloud
3. No package.json, build commands, or test framework present

## Development Notes

- Extension runs on all URLs (`<all_urls>` permission)
- Speech settings: rate=1, pitch=1, volume=1 (configurable in content.js:17-19)
- Language follows browser UI language automatically (can be manually set via `utter.lang`)
- Uses `document_idle` run timing for content script injection