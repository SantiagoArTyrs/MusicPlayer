import { ref, onMounted, computed } from 'vue'
import { DoublyLinkedList, Song } from '@/models/DoublyLinkedList'

export function useMusicPlayer() {
  const BASE_URL = 'http://localhost:3000/music'
  const list = new DoublyLinkedList<Song>()

  // Inicializar con canciones de ejemplo
  const initialSongs = [
    new Song('Doomsday', 'MF DOOM', `${BASE_URL}/song1.mp3`, `${BASE_URL}/cover1.jpg`),
    new Song(
      'Rapp Snitch Knishes',
      'MF DOOM (ft. Mr Fantastic)',
      `${BASE_URL}/song2.mp3`,
      `${BASE_URL}/cover2.jpg`,
    ),
    new Song('Kon Karne', 'MF DOOM', `${BASE_URL}/song3.mp3`, `${BASE_URL}/cover2.jpg`),
    new Song('Homicide', 'Logic (feat. Eminem)', `${BASE_URL}/song4.mp3`, `${BASE_URL}/cover4.jpg`),
    new Song(
      'Red and Gold',
      'MF DOOM (feat. King Ghidra)',
      `${BASE_URL}/song5.mp3`,
      `${BASE_URL}/cover1.jpg`,
    ),
    new Song('Not Like Us', 'Kendrick Lamar', `${BASE_URL}/song6.mp3`, `${BASE_URL}/cover6.jpg`),
    new Song('Like Him', 'Tyler the Creator', `${BASE_URL}/song7.mp3`, `${BASE_URL}/cover7.jpg`),
    new Song('Big Poppa', 'The Notorius B.I.G', `${BASE_URL}/song8.mp3`, `${BASE_URL}/cover8.jpg`),
    new Song('1985', 'The Alchemist', `${BASE_URL}/song9.mp3`, `${BASE_URL}/cover9.jpg`),
    new Song('PRIDE', 'Kendrick Lamar', `${BASE_URL}/song10.mp3`, `${BASE_URL}/cover10.jpg`),
    new Song('Money Trees', 'Kendrick Lamar', `${BASE_URL}/song11.mp3`, `${BASE_URL}/cover11.jpg`),
    new Song('I Wonder', 'YE', `${BASE_URL}/song12.mp3`, `${BASE_URL}/cover12.jpg`),
    new Song('Runaway', 'YE', `${BASE_URL}/song13.mp3`, `${BASE_URL}/cover13.jpg`),

    // ... otras canciones iniciales
  ]

  initialSongs.forEach((song) => list.add(song))

  const currentSong = ref<Song | null>(list.getCurrent())
  const isPlaying = ref(false)
  const audioRef = ref<HTMLAudioElement | null>(null)

  // Estado del formulario
  const showAddSongForm = ref(false)
  const showLibrary = ref(false)
  const newSongTitle = ref('')
  const newSongArtist = ref('')
  const newSongUrl = ref('')
  const newSongImage = ref('')
  const newSongPosition = ref(0)
  const addAtStart = ref(false)
  const addAtEnd = ref(true)
  const addAtPosition = ref(false)

  // Biblioteca de canciones
  const availableSongs = ref<Song[]>([])

  // Funciones para manejar canciones
  const addSongToPlaylist = (song: Song, position?: number) => {
    try {
      if (position !== undefined) {
        list.addAt(song, Math.min(Math.max(0, position), list.size()))
      } else if (addAtStart.value) {
        list.addAtStart(song)
      } else {
        list.addAtEnd(song)
      }

      if (!currentSong.value) {
        currentSong.value = song
        isPlaying.value = true
        playAudioFresh()
      }
    } catch (error) {
      console.error('Error adding song:', error)
    }
  }

  const addNewSong = () => {
    if (!newSongTitle.value || !newSongArtist.value || !newSongUrl.value) return

    const song = new Song(
      newSongTitle.value,
      newSongArtist.value,
      newSongUrl.value,
      newSongImage.value || undefined,
    )

    addSongToPlaylist(song, addAtPosition.value ? newSongPosition.value : undefined)

    resetAddSongForm()
    showAddSongForm.value = false
  }

  const loadAvailableSongs = async () => {
    try {
      const response = await fetch('/api/music')

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Expected JSON response')
      }

      const data = await response.json()
      availableSongs.value = data.map(
        (song: { title: string; artist: string; url: string; image?: string }) =>
          new Song(song.title, song.artist, song.url, song.image),
      )
    } catch (error) {
      console.error('Error loading songs:', error)
      availableSongs.value = []
    }
  }

  const resetAddSongForm = () => {
    newSongTitle.value = ''
    newSongArtist.value = ''
    newSongUrl.value = ''
    newSongImage.value = ''
    newSongPosition.value = 0
    addAtStart.value = false
    addAtEnd.value = true
    addAtPosition.value = false
  }

  // Funciones del reproductor
  const play = () => {
    audioRef.value
      ?.play()
      .then(() => (isPlaying.value = true))
      .catch((e) => {
        console.error('Playback error:', e)
        isPlaying.value = false
      })
  }

  const pause = () => {
    audioRef.value?.pause()
    isPlaying.value = false
  }

  const togglePlay = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    isPlaying.value ? pause() : play()
  }

  const playAudioFresh = () => {
    if (!audioRef.value) return

    const audio = audioRef.value
    audio.pause()
    audio.currentTime = 0
    audio.load()

    audio.oncanplay = () => {
      if (isPlaying.value) {
        audio.play().catch((e) => {
          console.error('Error al reproducir:', e)
          isPlaying.value = false
        })
      }
    }

    audio.onerror = () => {
      console.error('Error al cargar audio')
      isPlaying.value = false
    }
  }

  const playNext = () => {
    const next = list.next()
    if (next) {
      currentSong.value = next
      isPlaying.value = true
      playAudioFresh()
    }
  }

  const playPrev = () => {
    const prev = list.prev()
    if (prev) {
      currentSong.value = prev
      isPlaying.value = true
      playAudioFresh()
    }
  }

  // Barra de progreso
  const progress = ref(0)
  const currentTime = ref(0)
  const duration = ref(0)
  const progressBar = ref<HTMLDivElement | null>(null)

  const updateProgress = () => {
    if (audioRef.value) {
      currentTime.value = audioRef.value.currentTime
      duration.value = audioRef.value.duration || 0
      progress.value = (currentTime.value / duration.value) * 100
    }
  }

  const handleSeek = (e: MouseEvent) => {
    if (!progressBar.value || !audioRef.value) return
    const rect = progressBar.value.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration.value
    audioRef.value.currentTime = newTime
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  // Inicialización
  onMounted(() => {
    if (audioRef.value) {
      audioRef.value.addEventListener('timeupdate', updateProgress)
      audioRef.value.addEventListener('loadedmetadata', updateProgress)
    }
    loadAvailableSongs()
  })

  return {
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
    showLibrary,
    newSongTitle,
    newSongArtist,
    newSongUrl,
    newSongImage,
    newSongPosition,
    addAtStart,
    addAtEnd,
    addAtPosition,
    addNewSong,
    resetAddSongForm,
    listSize: computed(() => list.size()),
    availableSongs,
    loadAvailableSongs,
    addSongToPlaylist,
    list,
  }
}
