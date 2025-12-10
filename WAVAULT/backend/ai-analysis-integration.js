/**
 * ai-analysis-integration.js
 * Módulo para integración con analyze_beat_ai.py
 * Proporciona funciones para invocar análisis de audio con IA
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AudioAIAnalyzer {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.scriptPath = path.join(__dirname, 'analyze_beat_ai.py');
  }

  /**
   * Analiza un archivo de audio con IA
   * @param {string} audioPath - Ruta absoluta del archivo de audio
   * @param {string} filename - Nombre del archivo (opcional)
   * @returns {Promise<Object>} - Objeto con análisis técnico e inferencia IA
   */
  async analyze(audioPath, filename = null) {
    return new Promise((resolve, reject) => {
      // Validar que el archivo existe
      if (!fs.existsSync(audioPath)) {
        return reject(new Error(`Archivo no encontrado: ${audioPath}`));
      }

      // Validar que el script existe
      if (!fs.existsSync(this.scriptPath)) {
        return reject(new Error(`Script de análisis no encontrado: ${this.scriptPath}`));
      }

      // Usar nombre del archivo si no se proporciona
      if (!filename) {
        filename = path.basename(audioPath);
      }

      // Configurar variables de entorno
      const env = {
        ...process.env,
        GEMINI_API_KEY: this.apiKey || '', // permite fallback local en Python
        PYTHONUNBUFFERED: '1' // Desactivar buffering para output en tiempo real
      };

      // Iniciar proceso Python con archivo y nombre
      const pythonProcess = spawn('python3', [this.scriptPath, audioPath, filename], { env });

      let output = '';
      let errorOutput = '';
      let timeoutHandle = null;

      // Timeout de 60 segundos para análisis
      timeoutHandle = setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        reject(new Error('Timeout: El análisis tardó más de 60 segundos'));
      }, 60000);

      // Capturar salida estándar
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      // Capturar errores de stderr (warnings de librosa, etc)
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        // Los warnings de librosa van a stderr pero no son errores fatales
      });

      // Manejar cierre del proceso
      pythonProcess.on('close', (code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`No se pudo parsear JSON: ${output.substring(0, 500)}`));
          }
        } else {
          try {
            const errorData = JSON.parse(output || errorOutput);
            reject(new Error(`${errorData.message || 'Error desconocido'}`));
          } catch {
            reject(new Error(`Proceso falló con código ${code}: ${errorOutput.substring(0, 500)}`));
          }
        }
      });

      // Manejar errores de proceso
      pythonProcess.on('error', (err) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(new Error(`Error al ejecutar script: ${err.message}`));
      });
    });
  }

  /**
   * Analiza múltiples archivos secuencialmente
   * @param {string[]} audioPaths - Array de rutas de archivos
   * @returns {Promise<Object[]>} - Array de resultados
   */
  async analyzeBatch(audioPaths) {
    const results = [];
    for (const audioPath of audioPaths) {
      try {
        const result = await this.analyze(audioPath);
        results.push({
          file: audioPath,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          file: audioPath,
          success: false,
          error: error.message
        });
      }
    }
    return results;
  }

  /**
   * Obtiene solo el Mood e inferencias sin datos técnicos
   * (Útil si solo necesitas IA)
   */
  async analyzeInferenceOnly(audioPath) {
    const result = await this.analyze(audioPath);
    if (result.status === 'success') {
      return {
        status: 'success',
        ai_inference: result.ai_inference
      };
    }
    return result;
  }

  /**
   * Obtiene solo datos técnicos sin IA
   * (Útil si solo necesitas análisis local)
   */
  async analyzeTechnicalOnly(audioPath) {
    const result = await this.analyze(audioPath);
    if (result.status === 'success') {
      return {
        status: 'success',
        technical_data: result.technical_data
      };
    }
    return result;
  }
}

module.exports = AudioAIAnalyzer;

/**
 * EJEMPLOS DE USO:
 * 
 * // Uso básico
 * const analyzer = new AudioAIAnalyzer();
 * analyzer.analyze('/ruta/audio.mp3')
 *   .then(result => console.log(result))
 *   .catch(err => console.error(err));
 * 
 * // Con API Key personalizada
 * const analyzer = new AudioAIAnalyzer('tu_api_key');
 * 
 * // Análisis por lotes
 * const files = ['/audio1.mp3', '/audio2.mp3', '/audio3.mp3'];
 * analyzer.analyzeBatch(files)
 *   .then(results => console.log(results));
 * 
 * // Solo inferencia IA
 * analyzer.analyzeInferenceOnly('/audio.mp3')
 *   .then(result => console.log(result.ai_inference));
 */
