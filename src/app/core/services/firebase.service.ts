import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { Firestore, getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { FirebaseStorage, getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Messaging, getMessaging, getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../../environments/environment';

export interface Post {
  id?: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  createdAt: any;
  updatedAt?: any;
  votes: number;
  upvotes: string[]; // IDs de usuarios que dieron Like (👍)
  downvotes: string[]; // IDs de usuarios que dieron Dislike (👎)
  commentsCount?: number; // Cantidad de comentarios
  imageUrl?: string; // URL de imagen externa
  videoUrl?: string; // URL de video (YouTube, Vimeo o archivo MP4/WebM)
  fileUrl?: string; // URL del archivo subido (PDF, imagen)
  fileName?: string;
}

export interface Comment {
  id?: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  
  private app!: FirebaseApp;
  private auth!: Auth;
  private firestore!: Firestore;
  private storage!: FirebaseStorage;
  private messaging!: Messaging | null;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthReady = signal<boolean>(false);

  constructor() {
    if (!this.isBrowser) return;

    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
    
    try {
      this.messaging = getMessaging(this.app);
    } catch (e) {
      console.warn('Firebase Messaging no está soportado.');
      this.messaging = null;
    }

    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isAuthReady.set(true);
    });
  }

  // --- AUTENTICACIÓN & PERFIL ---
  async login(email: string, pass: string) { return signInWithEmailAndPassword(this.auth, email, pass); }
  async register(email: string, pass: string) { return createUserWithEmailAndPassword(this.auth, email, pass); }
  async logout() { return signOut(this.auth); }
  
  async updateUserProfile(displayName: string, photoURL: string = '') {
    const user = this.currentUser();
    if (!user) throw new Error('No autenticado');
    await updateProfile(user, { displayName, photoURL });
    this.currentUser.set({ ...user, displayName, photoURL } as User); // Forzar reactividad
  }

  // --- FIRESTORE (PUBLICACIONES) ---
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'votes' | 'author' | 'authorId' | 'upvotes' | 'downvotes'>) {
    const user = this.currentUser();
    if (!user) throw new Error('No autenticado');
    
    const newPost: Post = {
      ...postData,
      author: user.displayName || user.email?.split('@')[0] || 'Anónimo',
      authorId: user.uid,
      createdAt: Timestamp.now(),
      votes: 0,
      upvotes: [],
      downvotes: [],
      commentsCount: 0
    };

    const docRef = await addDoc(collection(this.firestore, 'posts'), newPost);
    return docRef.id;
  }

  async updatePost(
    postId: string,
    changes: Partial<Pick<Post, 'title' | 'body' | 'category' | 'tags' | 'imageUrl' | 'videoUrl' | 'fileUrl' | 'fileName'>>
  ) {
    const user = this.currentUser();
    if (!user || !this.firestore) throw new Error('No autenticado');

    const postRef = doc(this.firestore, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) throw new Error('Publicación no encontrada');

    const current = snap.data() as Post;
    if (current.authorId !== user.uid) {
      throw new Error('Solo el autor puede editar esta publicación');
    }

    await updateDoc(postRef, {
      ...changes,
      updatedAt: Timestamp.now()
    });
  }

  async getPosts(): Promise<Post[]> {
    if (!this.firestore) return [];
    const q = query(collection(this.firestore, 'posts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));

    // Si algún post antiguo no tiene commentsCount calculado, lo obtenemos de su subcolección
    await Promise.all(
      posts.map(async (p) => {
        if (typeof p.commentsCount !== 'number' && p.id) {
          try {
            const cSnap = await getDocs(collection(this.firestore, `posts/${p.id}/comments`));
            p.commentsCount = cSnap.size;
          } catch {
            p.commentsCount = 0;
          }
        }
      })
    );

    return posts;
  }

  async getPost(id: string): Promise<Post | null> {
    if (!this.firestore) return null;
    const docSnap = await getDoc(doc(this.firestore, 'posts', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Post : null;
  }

  // --- LIKES / DISLIKES (VOTOS) ---
  async votePost(postId: string, voteType: 'up' | 'down') {
    const user = this.currentUser();
    if (!user || !this.firestore) throw new Error('No autenticado');

    const postRef = doc(this.firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const post = postSnap.data() as Post;
    let upvotes = post.upvotes || [];
    let downvotes = post.downvotes || [];

    const alreadyUpvoted = upvotes.includes(user.uid);
    const alreadyDownvoted = downvotes.includes(user.uid);

    // Limpiar voto previo
    upvotes = upvotes.filter(id => id !== user.uid);
    downvotes = downvotes.filter(id => id !== user.uid);

    // Si vuelve a pulsar el mismo botón, se quita el voto (toggle); si no, se aplica el nuevo
    if (voteType === 'up' && !alreadyUpvoted) {
      upvotes.push(user.uid);
    }
    if (voteType === 'down' && !alreadyDownvoted) {
      downvotes.push(user.uid);
    }

    const votes = upvotes.length - downvotes.length;
    await updateDoc(postRef, { upvotes, downvotes, votes });
  }

  // --- COMENTARIOS ---
  async addComment(postId: string, text: string) {
    const user = this.currentUser();
    if (!user || !this.firestore) throw new Error('No autenticado');

    const newComment: Comment = {
      author: user.displayName || user.email?.split('@')[0] || 'Anónimo',
      authorId: user.uid,
      text,
      createdAt: Timestamp.now()
    };
    await addDoc(collection(this.firestore, `posts/${postId}/comments`), newComment);

    // Actualizar contador de comentarios en el documento del post
    const commentsSnap = await getDocs(collection(this.firestore, `posts/${postId}/comments`));
    const postRef = doc(this.firestore, 'posts', postId);
    await updateDoc(postRef, { commentsCount: commentsSnap.size });
  }

  async getComments(postId: string): Promise<Comment[]> {
    if (!this.firestore) return [];
    const q = query(collection(this.firestore, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
  }

  // --- STORAGE (ARCHIVOS) ---
  async uploadFile(file: File, folder: string = 'uploads'): Promise<string> {
    if (!this.storage) throw new Error('Storage no inicializado');
    const fileName = `${new Date().getTime()}_${file.name}`;
    const fileRef = ref(this.storage, `${folder}/${fileName}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  // --- NOTIFICACIONES ---
  async requestNotificationPermission() {
    if (!this.messaging || !this.isBrowser) return null;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, { vapidKey: environment.vapidKey });
        return token;
      }
    } catch (error) { console.error(error); }
    return null;
  }
}
