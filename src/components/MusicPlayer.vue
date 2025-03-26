<template>
  <div class="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
    <transition name="fade-slide" appear>
      <div class="w-full max-w-md p-7 bg-zinc-800 rounded-2xl shadow-xl relative overflow-hidden bg-animated">
        <!-- Botón flotante para agregar canciones (fuera del contenedor principal) -->
        <button @click="openModal"
          class="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 rounded-full shadow-xl transition-all z-50"
          aria-label="Añadir canción">
          <PlusIcon class="w-6 h-6 text-white" />
        </button>
        <button @click="showLibrary = !showLibrary"
          class="fixed bottom-6 right-24 p-4 bg-green-600 hover:bg-green-700 rounded-full shadow-xl transition-all z-50"
          aria-label="Biblioteca de canciones">
          <ListBulletIcon class="w-6 h-6 text-white" />
        </button>

        <!-- Contenido principal del reproductor -->
        <div class="relative z-10">
          <!-- Portada animada -->
          <transition name="fade" mode="out-in">
            <div v-if="currentSong?.image" :key="currentSong.image"
              class="w-full aspect-square rounded-xl mb-4 overflow-hidden shadow-lg animate-pulse-low hover:animate-none hover:scale-105 transition-transform duration-500">
              <img :src="currentSong.image" alt="Portada" class="w-full h-full object-cover" />
            </div>
          </transition>

          <!-- Título y artista -->
          <transition name="fade" mode="out-in">
            <h2 :key="currentSong?.title" class="text-2xl font-bold mb-1">
              {{ currentSong?.title || 'Sin canción' }}
            </h2>
          </transition>
          <transition name="fade" mode="out-in">
            <p :key="currentSong?.artist" class="text-sm text-zinc-400 mb-4">
              {{ currentSong?.artist || '' }}
            </p>
          </transition>

          <!-- Audio -->
          <audio ref="audioRef" :src="currentSong?.url" @ended="playNext" class="w-full my-4"></audio>

          <!-- Barra de progreso -->
          <div class="w-full mb-4">
            <div class="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
              <span>{{ formatTime(currentTime) }}</span>
              <span>{{ formatTime(duration) }}</span>
            </div>
            <div class="relative h-2 bg-zinc-700 rounded cursor-pointer group" @click="handleSeek" ref="progressBar">
              <div class="absolute top-0 left-0 h-2 bg-blue-500 rounded transition-all duration-200"
                :style="{ width: `${progress}%` }"></div>
              <div
                class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transform -translate-x-1/2 transition-all duration-150"
                :style="{ left: `${progress}%` }"></div>
            </div>
          </div>

          <!-- Controles -->
          <div class="flex justify-center gap-8 mt-4">
            <button @click="playPrev" class="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
              <BackwardIcon class="w-8 h-8 text-white" />
            </button>
            <button @click="togglePlay"
              class="p-3 bg-white/20 rounded-full hover:bg-white/30 transition transform hover:scale-105">
              <component :is="isPlaying ? PauseIcon : PlayIcon" class="w-8 h-8 text-white" />
            </button>
            <button @click="playNext" class="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
              <ForwardIcon class="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal para agregar canciones (fuera del contenedor principal) -->
    <transition name="modal-fade">
      <div v-if="showAddSongForm" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
        @click.self="closeModal">
        <!-- Contenedor del modal -->
        <div class="bg-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all">
          <!-- Header del modal -->
          <div class="bg-zinc-900 px-6 py-4 border-b border-zinc-700 flex justify-between items-center">
            <h3 class="text-xl font-bold">Agregar Nueva Canción</h3>
            <button @click="closeModal" class="text-zinc-400 hover:text-white">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          <!-- Modal para la biblioteca de canciones -->
          <transition name="modal-fade">
            <div v-if="showLibrary"
              class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
              @click.self="showLibrary = false">
              <div class="bg-zinc-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div class="bg-zinc-900 px-6 py-4 border-b border-zinc-700 flex justify-between items-center">
                  <h3 class="text-xl font-bold">Biblioteca de Canciones</h3>
                  <button @click="showLibrary = false" class="text-zinc-400 hover:text-white">
                    <XMarkIcon class="w-6 h-6" />
                  </button>
                </div>

                <div class="overflow-y-auto flex-1 p-4">
                  <div v-if="availableSongs.length === 0" class="text-center py-8 text-zinc-400">
                    No hay canciones disponibles
                  </div>

                  <div v-else class="space-y-2">
                    <div v-for="(song, index) in availableSongs" :key="index"
                      class="flex items-center justify-between p-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition">
                      <div class="flex items-center space-x-3 min-w-0">
                        <img v-if="song.image" :src="song.image" class="w-10 h-10 rounded object-cover">
                        <div class="min-w-0">
                          <p class="font-medium truncate">{{ song.title }}</p>
                          <p class="text-xs text-zinc-400 truncate">{{ song.artist }}</p>
                        </div>
                      </div>
                      <button @click="addSongToPlaylist(song)" class="p-1 text-blue-400 hover:text-blue-300 transition">
                        <PlusIcon class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <!-- Cuerpo del formulario -->
          <div class="p-6 space-y-4">
            <!-- Campo Título -->
            <div>
              <label class="block text-sm font-medium mb-2 text-zinc-300">Título *</label>
              <input v-model="newSongTitle" type="text" required
                class="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-400"
                placeholder="Nombre de la canción">
            </div>

            <!-- Campo Artista -->
            <div>
              <label class="block text-sm font-medium mb-2 text-zinc-300">Artista *</label>
              <input v-model="newSongArtist" type="text" required
                class="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-400"
                placeholder="Nombre del artista">
            </div>

            <!-- Campo URL del Audio -->
            <div>
              <label class="block text-sm font-medium mb-2 text-zinc-300">URL del Audio *</label>
              <input v-model="newSongUrl" type="url" required
                class="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-400"
                placeholder="https://ejemplo.com/audio.mp3">
            </div>

            <!-- Campo Imagen (opcional) -->
            <div>
              <label class="block text-sm font-medium mb-2 text-zinc-300">URL de la Imagen</label>
              <input v-model="newSongImage" type="url"
                class="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-400"
                placeholder="https://ejemplo.com/imagen.jpg">
            </div>

            <!-- Selector de posición -->
            <div class="pt-2">
              <label class="block text-sm font-medium mb-3 text-zinc-300">Posición en la lista</label>
              <div class="space-y-3">
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" v-model="addAtPosition" :value="false"
                    class="h-4 w-4 text-blue-600 border-zinc-600 focus:ring-blue-500 bg-zinc-700">
                  <span class="text-zinc-300">Agregar al final de la lista</span>
                </label>

                <label class="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" v-model="addAtPosition" :value="true"
                    class="h-4 w-4 text-blue-600 border-zinc-600 focus:ring-blue-500 bg-zinc-700">
                  <span class="text-zinc-300">Posición específica:</span>
                  <input v-model="newSongPosition" type="number" min="0" :max="listSize" :disabled="!addAtPosition"
                    class="w-20 px-3 py-1 bg-zinc-700 border border-zinc-600 rounded focus:ring-blue-500 focus:border-blue-500 text-white">
                </label>
              </div>
            </div>
          </div>

          <!-- Footer del modal -->
          <div class="bg-zinc-900 px-6 py-4 border-t border-zinc-700 flex justify-end space-x-3">
            <button @click="closeModal"
              class="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors">
              Cancelar
            </button>
            <button @click="addNewSong" :disabled="!formValid"
              class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Agregar Canción
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon, PlusIcon, XMarkIcon, ListBulletIcon } from '@heroicons/vue/24/solid'
import { useMusicPlayer } from '@/composables/useMusicPlayer'
import { ref, onMounted, computed } from 'vue'

const {
  currentSong,
  isPlaying,
  audioRef,
  togglePlay,
  playNext,
  playPrev,
  currentTime,
  duration,
  progress,
  formatTime,
  handleSeek,
  progressBar,
  showAddSongForm,
  newSongTitle,
  newSongArtist,
  newSongUrl,
  newSongImage,
  newSongPosition,
  addAtPosition,
  addNewSong,
  resetAddSongForm,
  listSize,
  availableSongs,
  loadAvailableSongs,
  addSongToPlaylist
} = useMusicPlayer()

const showLibrary = ref(false)
const formValid = computed(() => {
  return newSongTitle.value.trim() && newSongArtist.value.trim() && newSongUrl.value.trim()
})

const openModal = () => {
  showAddSongForm.value = true
}

const closeModal = () => {
  showAddSongForm.value = false
  resetAddSongForm()
}

// Cargar canciones disponibles al montar el componente
onMounted(() => {
  loadAvailableSongs()
})

</script>

<style scoped>
/* Transiciones para el modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Animación para el contenedor del modal */
.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: translateY(-20px);
}

/* Estilo para el fondo animado del reproductor */
.bg-animated {
  background: linear-gradient(-45deg, #1e1e1e, #2d2d2d, #1a1a1a, #2d2d2d);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* Transiciones para los elementos del reproductor */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Scrollbar personalizada */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #3f3f3f;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #525252;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #636363;
}
</style>
