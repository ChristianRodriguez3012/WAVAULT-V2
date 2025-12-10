const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

class AudioAnalyzer {
  constructor(options = {}) {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.testMode = options.testMode || false;
    
    if (!this.apiKey && !this.testMode) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Analyze an audio file and extract musical features
   * @param {string} filePath - Path to the audio file
   * @param {string} fileName - Name of the audio file
   * @returns {Promise<Object>} Analysis results including BPM, key, genre, etc.
   */
  async analyze(filePath, fileName) {
    try {
      console.log(`📊 Analizando beat: ${fileName}`);

      // Check if file exists (async)
      try {
        await fs.promises.access(filePath);
      } catch {
        throw new Error(`File not found: ${filePath}`);
      }

      // Test mode - return mock data
      if (this.testMode) {
        console.log("🧪 Test mode: returning mock analysis data");
        return {
          success: true,
          fileName: fileName,
          analysis: {
            bpm: 140,
            key: "C Minor",
            genre: "Hip Hop",
            mood: "Dark and energetic",
            instruments: ["808 Bass", "Hi-Hats", "Snare", "Synth"],
            tags: ["trap", "dark", "energetic", "hip-hop"],
            tempo: "fast",
            energy: "high",
            description: "A dark and energetic hip-hop beat with prominent 808 bass and crisp hi-hats"
          }
        };
      }

      // Read the audio file (async)
      const audioBuffer = await fs.promises.readFile(filePath);
      const base64Audio = audioBuffer.toString('base64');

      // Detect MIME type from file extension
      const fileExt = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac'
      };
      const mimeType = mimeTypes[fileExt] || 'audio/mpeg';

      // Get the Gemini model
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create the prompt for audio analysis
      const prompt = `You are an expert music producer and audio engineer. Analyze this audio file and provide detailed information about its musical characteristics.

Please provide your analysis in the following JSON format (respond ONLY with valid JSON, no additional text):

{
  "bpm": <estimated BPM as integer>,
  "key": "<musical key, e.g., 'C Minor', 'G Major'>",
  "genre": "<primary genre>",
  "mood": "<mood/vibe of the track>",
  "instruments": ["<list of detected instruments>"],
  "tags": ["<relevant tags for categorization>"],
  "tempo": "<tempo description: slow/medium/fast>",
  "energy": "<energy level: low/medium/high>",
  "description": "<brief description of the track>"
}

Be as accurate as possible with the BPM and key detection. If you're uncertain about any field, provide your best estimate.`;

      // Prepare the file data for Gemini
      const filePart = {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType
        }
      };

      // Generate content with the audio file and prompt
      const result = await model.generateContent([prompt, filePart]);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      let analysisData;
      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("❌ Error parsing Gemini response:", parseError);
        console.log("Raw response:", text);
        
        // Return default analysis if parsing fails
        analysisData = {
          bpm: 120,
          key: "Unknown",
          genre: "Electronic",
          mood: "Unknown",
          instruments: [],
          tags: [],
          tempo: "medium",
          energy: "medium",
          description: "Analysis unavailable",
          error: "Failed to parse AI response"
        };
      }

      console.log("✅ Análisis completado");
      return {
        success: true,
        fileName: fileName,
        analysis: analysisData
      };

    } catch (error) {
      console.error("❌ Error analyzing audio:", error.message);
      return {
        success: false,
        error: error.message,
        fileName: fileName,
        analysis: {
          bpm: 120,
          key: "Unknown",
          genre: "Unknown",
          mood: "Unknown",
          instruments: [],
          tags: [],
          tempo: "medium",
          energy: "medium",
          description: "Analysis failed"
        }
      };
    }
  }
}

module.exports = AudioAnalyzer;
