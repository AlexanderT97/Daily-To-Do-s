import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, addDoc, getDocs, deleteDoc, collection, doc };

// Funktion: Tasks abrufen
export const fetchTasksFromFirestore = async () => {
  const querySnapshot = await getDocs(collection(db, "tasks"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Funktion: Library-Tasks abrufen
export const fetchLibraryTasksFromFirestore = async () => {
  const querySnapshot = await getDocs(collection(db, "libraryTasks"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Funktion: Task hinzufügen
export const addTaskToFirestore = async (task) => {
  const docRef = await addDoc(collection(db, "tasks"), task);
  return docRef.id;
};

// Funktion: Library-Task hinzufügen
export const addLibraryTaskToFirestore = async (task) => {
  const docRef = await addDoc(collection(db, "libraryTasks"), task);
  return docRef.id;
};

// Funktion: Library-Task löschen
export const deleteLibraryTaskFromFirestore = async (taskId) => {
  await deleteDoc(doc(db, "libraryTasks", taskId));
};

// Funktion: Task löschen
export const deleteTaskFromFirestore = async (taskId) => {
  await deleteDoc(doc(db, "tasks", taskId));
};

// Funktion: Task aktualisieren (allgemein)
export const updateTaskInFirestore = async (taskId, updatedTask) => {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, updatedTask);
};

// Funktion: Task-Status abschließen/aktualisieren
export const updateTaskCompletionInFirestore = async (taskId, completed) => {
  const taskRef = doc(db, "tasks", taskId);
  try {
    await updateDoc(taskRef, { completed });
    console.log(`Task ${taskId} completed status updated to ${completed}`);
  } catch (error) {
    console.error("Error updating task in Firestore: ", error);
  }
};

export const addTaskFromLibraryToFirestore = async (libraryTask) => {
  // Erstelle eine neue Kopie des Tasks ohne die ursprüngliche ID
  const { id, ...taskData } = libraryTask;  // Entfernt das "id"-Feld

  // Füge den Task in die 'tasks' Collection ein (Firestore erstellt automatisch eine neue ID)
  const docRef = await addDoc(collection(db, "tasks"), taskData);

  return docRef.id; // Gibt die neue ID zurück
};
