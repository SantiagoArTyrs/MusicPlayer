// 🎵 Clase Song
export class Song {
  title: string
  artist: string
  url: string
  image?: string
  cover: string | undefined

  constructor(title: string, artist: string, url: string, image?: string) {
    this.title = title
    this.artist = artist
    this.url = url
    this.image = image
  }
}

// 🔗 Nodo doblemente enlazado
class Node<T> {
  constructor(
    public value: T,
    public next: Node<T> | null = null,
    public prev: Node<T> | null = null,
  ) {}
}

// 🧠 Lista doblemente enlazada con funciones útiles
export class DoublyLinkedList<T> {
  private head: Node<T> | null = null
  private tail: Node<T> | null = null
  private current: Node<T> | null = null
  private length: number = 0

  // 👉 Agrega al final
  add(item: T): void {
    const node = new Node(item)
    if (!this.head) {
      this.head = this.tail = this.current = node
    } else {
      this.tail!.next = node
      node.prev = this.tail
      this.tail = node
    }
    this.length++
  }

  addAt(item: T, position: number): void {
    if (position < 0 || position > this.length) {
      throw new Error('Position out of bounds')
    }

    const node = new Node(item)

    if (position === 0) {
      if (!this.head) {
        this.head = this.tail = this.current = node
      } else {
        node.next = this.head
        this.head.prev = node
        this.head = node
      }
    } else if (position === this.length) {
      this.add(item)
    } else {
      let current = this.head
      for (let i = 0; i < position - 1; i++) {
        current = current!.next
      }
      node.next = current!.next
      node.prev = current
      current!.next!.prev = node
      current!.next = node
    }

    this.length++
  }

  // 👉 Inserta en una posición específica
  insertAt(index: number, item: T): void {
    if (index < 0 || index > this.length) return

    const node = new Node(item)

    if (index === 0) {
      if (!this.head) {
        this.head = this.tail = this.current = node
      } else {
        node.next = this.head
        this.head.prev = node
        this.head = node
      }
    } else if (index === this.length) {
      this.add(item)
      return
    } else {
      let current = this.head
      for (let i = 0; i < index - 1; i++) {
        current = current!.next
      }
      node.next = current!.next
      node.prev = current
      current!.next!.prev = node
      current!.next = node
    }

    this.length++
  }

  // 👉 Elimina en una posición
  removeAt(index: number): void {
    if (index < 0 || index >= this.length || !this.head) return

    let toRemove: Node<T> | null = this.head

    if (index === 0) {
      if (this.head === this.tail) {
        this.head = this.tail = this.current = null
      } else {
        this.head = this.head.next
        this.head!.prev = null
        if (this.current === toRemove) this.current = this.head
      }
    } else {
      for (let i = 0; i < index; i++) {
        toRemove = toRemove!.next
      }

      if (toRemove?.prev) {
        toRemove.prev.next = toRemove.next
      }

      if (toRemove?.next) {
        toRemove.next.prev = toRemove.prev
      }

      if (toRemove === this.tail) {
        this.tail = toRemove.prev
      }

      if (toRemove === this.current) {
        this.current = this.head
      }
    }

    this.length--
  }

  // 👉 Obtiene el valor actual
  getCurrent(): T | null {
    return this.current?.value ?? null
  }

  // 👉 Pasa a la siguiente
  next(): T | null {
    if (this.current?.next) {
      this.current = this.current.next
      return this.current.value
    }
    return null
  }

  // 👉 Pasa a la anterior
  prev(): T | null {
    if (this.current?.prev) {
      this.current = this.current.prev
      return this.current.value
    }
    return null
  }

  // 👉 Tamaño de la lista
  size(): number {
    return this.length
  }

  // 👉 Busca el índice de un elemento
  getIndexOf(item: T): number {
    let current = this.head
    let index = 0

    while (current) {
      if (current.value === item) return index
      current = current.next
      index++
    }

    return -1
  }

  // ✨ Agrega al inicio
  addAtStart(item: T): void {
    this.insertAt(0, item)
  }

  // ✨ Alias para agregar al final
  addAtEnd(item: T): void {
    this.add(item)
  }

  // 🗑️ Alias legible para eliminar
  removeSongAt(index: number): void {
    this.removeAt(index)
  }
}
