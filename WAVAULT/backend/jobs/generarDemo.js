const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const tagPath = path.join(__dirname, "..", "assets", "tag.mp3");

function generarDemoConTag(inputPath, outputPath, callback) {
  if (!fs.existsSync(inputPath)) {
    return callback(new Error("❌ El archivo de audio original no existe."));
  }

  if (!fs.existsSync(tagPath)) {
    return callback(new Error("❌ El archivo tag.mp3 no fue encontrado."));
  }

  ffmpeg.ffprobe(inputPath, (err, metadata) => {
    if (err) return callback(err);

    const duration = metadata.format.duration;
    if (!duration || isNaN(duration)) {
      return callback(new Error("❌ Duración inválida del beat."));
    }

    const delayTag1 = 5000; // 5 segundos
    const delayTag2 = duration > 10 ? Math.floor((duration - 5) * 1000) : null;

    const filters = [
      `[1:a]adelay=${delayTag1}|${delayTag1},volume=0.5[tag1]`,
    ];

    let finalMix;

    if (delayTag2) {
      filters.push(`[1:a]adelay=${delayTag2}|${delayTag2},volume=0.5[tag2]`);
      filters.push(`[0:a][tag1][tag2]amix=inputs=3:duration=longest:dropout_transition=2`);
      finalMix = null; // no se necesita nombre de salida, es el default
    } else {
      filters.push(`[0:a][tag1]amix=inputs=2:duration=longest:dropout_transition=2`);
      finalMix = null;
    }

    const command = ffmpeg()
      .input(inputPath)
      .input(tagPath)
      .complexFilter(filters)
      .audioBitrate("128k")
      .audioChannels(2)
      .audioFrequency(44100)
      .on("end", () => {
        console.log("✅ Demo generado:", outputPath);
        callback(null);
      })
      .on("error", (err) => {
        console.error("❌ Error real durante generación demo:", err.message);
        callback(err);
      })
      .save(outputPath);
  });
}

module.exports = generarDemoConTag;
