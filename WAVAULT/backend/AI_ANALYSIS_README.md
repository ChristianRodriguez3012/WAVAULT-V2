# AI Audio Analysis Integration

This module provides AI-powered audio analysis using Google's Gemini API to automatically extract musical features from audio files.

## Features

- **Automatic BPM Detection**: Estimates the beats per minute of the track
- **Key Detection**: Identifies the musical key (e.g., "C Minor", "G Major")
- **Genre Classification**: Determines the primary genre of the track
- **Mood Analysis**: Describes the mood/vibe of the track
- **Instrument Detection**: Lists detected instruments in the audio
- **Tag Generation**: Creates relevant tags for categorization
- **Tempo & Energy Analysis**: Evaluates tempo (slow/medium/fast) and energy levels

## Setup

### 1. Install Dependencies

```bash
npm install @google/generative-ai
```

### 2. Set Up API Key

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey) and set it as an environment variable:

```bash
export GEMINI_API_KEY='your-api-key-here'
```

## Usage

### Standalone Module

```javascript
const AudioAnalyzer = require('./ai-analysis-integration');

const analyzer = new AudioAnalyzer();
const result = await analyzer.analyze('path/to/audio.mp3', 'filename.mp3');

console.log(result);
// {
//   success: true,
//   fileName: "filename.mp3",
//   analysis: {
//     bpm: 140,
//     key: "C Minor",
//     genre: "Hip Hop",
//     mood: "Dark and energetic",
//     instruments: ["808 Bass", "Hi-Hats", "Snare", "Synth"],
//     tags: ["trap", "dark", "energetic", "hip-hop"],
//     tempo: "fast",
//     energy: "high",
//     description: "A dark and energetic hip-hop beat..."
//   }
// }
```

### Test Mode (for development)

```javascript
const analyzer = new AudioAnalyzer({ testMode: true });
const result = await analyzer.analyze('path/to/audio.mp3', 'filename.mp3');
// Returns mock data without calling the API
```

### API Endpoint

The server provides a `/analizar-audio` endpoint for audio analysis:

```bash
curl -X POST http://localhost:3000/analizar-audio \
  -F "audio=@path/to/audio.mp3"
```

### Integrated Beat Upload

When uploading beats, you can enable AI analysis by setting `useAI=true`:

```bash
curl -X POST http://localhost:3000/subir-beat \
  -F "title=My Beat" \
  -F "price=50" \
  -F "producer=ProducerName" \
  -F "useAI=true" \
  -F "cover=@cover.jpg" \
  -F "audio=@beat.mp3"
```

If BPM and key are not provided, the AI will automatically analyze and fill them in.

## Testing

### Quick Test

```bash
cd WAVAULT/backend
GEMINI_API_KEY='your-key' node -e "const Analyzer=require('./ai-analysis-integration');const a=new Analyzer();a.analyze('assets/tag.mp3','tag.mp3').then(r=>{console.log(JSON.stringify(r,null,2));}).catch(e=>{console.error(e);});"
```

### Test Mode (no API key needed)

```bash
node -e "const Analyzer=require('./ai-analysis-integration');const a=new Analyzer({testMode:true});a.analyze('assets/tag.mp3','tag.mp3').then(r=>{console.log(JSON.stringify(r,null,2));});"
```

## Error Handling

The module gracefully handles errors and returns default values when:
- Network connectivity issues occur
- API quota is exceeded
- File is not found
- Parsing errors occur

In error cases, it returns:
```javascript
{
  success: false,
  error: "error message",
  fileName: "filename.mp3",
  analysis: {
    bpm: 120,
    key: "Unknown",
    // ... default values
  }
}
```

## Configuration

The module uses `gemini-1.5-flash` model by default, which is optimized for:
- Fast response times
- Multimodal input (audio, images, text)
- Cost-effectiveness

## Limitations

- Currently supports MP3 audio files
- Requires internet connectivity to access Gemini API
- Analysis accuracy depends on audio quality and clarity
- Subject to Google Gemini API rate limits and quotas
