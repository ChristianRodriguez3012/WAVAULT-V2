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

      // Construir lista de fuentes (prioridad: clone/tagged > demo > original)
      const candidates = [
        this.dataset.audioProcessed,
        this.dataset.audioUrl,
        this.dataset.audio,
        this.dataset.demo,
        this.dataset.audioDemo
      ].filter(Boolean);

      // Si solo hay clone, añade original como fallback deduciendo el nombre
      const cloneCandidate = candidates.find(src => src.includes('_clone.'));
      if (cloneCandidate) {
        const originalGuess = cloneCandidate.replace('_clone.', '.');
        candidates.push(originalGuess);
      }

      const archivoPrincipal = candidates[0] || '/uploads/audio/' + this.dataset.beatId + '_clone.mp3';
      const fallbacks = [...new Set(candidates.filter(src => src && src !== archivoPrincipal))];

      const beatData = {
        id: this.dataset.beatId,
        nombre: this.querySelector('.beat-title, .beat-header h3, h3')?.textContent?.trim() || 'Sin título',
        productor: this.dataset.producer || this.querySelector('.beat-producer, .beat-artist')?.textContent?.trim() || 'Productor desconocido',
        portada: this.querySelector('.beat-cover, img')?.src || '/assets/img/placeholder.jpg',
        archivo: archivoPrincipal,
        fallbacks,
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
        
        const btnCandidates = [
          card.dataset.audioProcessed,
          card.dataset.audioUrl,
          card.dataset.audio,
          card.dataset.demo,
          card.dataset.audioDemo
        ].filter(Boolean);

        const btnClone = btnCandidates.find(src => src.includes('_clone.'));
        if (btnClone) {
          btnCandidates.push(btnClone.replace('_clone.', '.'));
        }

        const btnArchivo = btnCandidates[0] || '/uploads/audio/' + card.dataset.beatId + '_clone.mp3';
        const btnFallbacks = [...new Set(btnCandidates.filter(src => src && src !== btnArchivo))];

        const beatData = {
          id: card.dataset.beatId,
          nombre: card.querySelector('.beat-title, .beat-header h3, h3')?.textContent?.trim() || 'Sin título',
          productor: card.dataset.producer || card.querySelector('.beat-producer, .beat-artist')?.textContent?.trim() || 'Productor desconocido',
          portada: card.querySelector('.beat-cover, img')?.src || '/assets/img/placeholder.jpg',
          archivo: btnArchivo,
          fallbacks: btnFallbacks,
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
    card.dataset.playerAttached = 'true';
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
