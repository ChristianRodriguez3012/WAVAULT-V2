/**
 * Script para agregar evento de reproducción a todos los cards de beats
 * Se ejecuta después de cargar los beats en el feed
 * PRIORIDAD: audio_processed > audio (clon procesado > original)
 */

function setupBeatClickListeners() {
  // Buscar todos los beat-cards
  const beatCards = document.querySelectorAll('.beat-card');
  
  beatCards.forEach(card => {
    // Si ya tiene listener, omitir
    if (card.dataset.playerAttached === 'true') return;

    // Click en el card (excepto botones)
    card.addEventListener('click', function(e) {
      // No ejecutar si es click en botón específico
      if (e.target.closest('.btn-comprar') || 
          e.target.closest('.add-to-cart-btn') ||
          e.target.closest('button.add-to-cart-btn')) return;

      // Obtener datos del beat del card
      // PRIORIDAD: audio_processed (clon con baja calidad + tag) > audio (original)
      const beatData = {
        id: this.dataset.beatId,
        nombre: this.querySelector('.beat-title, .beat-header h3, h3')?.textContent?.trim() || 'Sin título',
        productor: this.querySelector('.beat-producer, .beat-artist, [data-producer]')?.textContent?.trim() || 'Productor desconocido',
        portada: this.querySelector('.beat-cover, img')?.src || '/assets/img/placeholder.jpg',
        // ✅ Prioridad: audio_processed > audio
        archivo: this.dataset.audioProcessed || 
                 this.dataset.audioUrl || 
                 this.dataset.audio || 
                 '/uploads/audio/' + this.dataset.beatId + '_clone.mp3',
        precio: this.dataset.precio || '0',
        bpm: this.dataset.bpm || this.querySelector('[data-bpm]')?.dataset?.bpm || '-',
        key: this.dataset.key || this.querySelector('[data-key]')?.dataset?.key || '-'
      };

      console.log(`🎵 Seleccionando beat: ${beatData.nombre}`);
      console.log(`   📁 Archivo: ${beatData.archivo}`);
      console.log(`   🎼 ${beatData.bpm} BPM • ${beatData.key} KEY`);

      // Reproducir beat
      if (window.wavaultPlayer) {
        window.wavaultPlayer.setBeat(beatData);
      } else {
        console.error("❌ WavaultPlayer no está disponible");
      }
    });

    // También permitir click en el botón play del overlay si existe
    const playBtn = card.querySelector('.play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const beatData = {
          id: card.dataset.beatId,
          nombre: card.querySelector('.beat-title, .beat-header h3, h3')?.textContent?.trim() || 'Sin título',
          productor: card.querySelector('.beat-producer, .beat-artist, [data-producer]')?.textContent?.trim() || 'Productor desconocido',
          portada: card.querySelector('.beat-cover, img')?.src || '/assets/img/placeholder.jpg',
          // ✅ Prioridad: audio_processed > audio
          archivo: card.dataset.audioProcessed || 
                   card.dataset.audioUrl || 
                   card.dataset.audio || 
                   '/uploads/audio/' + card.dataset.beatId + '_clone.mp3',
          precio: card.dataset.precio || '0',
          bpm: card.dataset.bpm || card.querySelector('[data-bpm]')?.dataset?.bpm || '-',
          key: card.dataset.key || card.querySelector('[data-key]')?.dataset?.key || '-'
        };

        console.log(`🎵 Reproduciendo beat (play btn): ${beatData.nombre}`);
        console.log(`   📁 Archivo: ${beatData.archivo}`);

        if (window.wavaultPlayer) {
          window.wavaultPlayer.setBeat(beatData);
        } else {
          console.error("❌ WavaultPlayer no está disponible");
        }
      });
    }

    // Marcar como procesado
    this.dataset.playerAttached = 'true';
  });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupBeatClickListeners);
} else {
  setupBeatClickListeners();
}

// Re-ejecutar si se carga contenido dinámico
const originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function(child) {
  const result = originalAppendChild.call(this, child);
  if (child.classList && (child.classList.contains('beat-card') || child.classList.contains('beat-feed'))) {
    setTimeout(setupBeatClickListeners, 100);
  }
  return result;
};
