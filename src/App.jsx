import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import "./App.css";
import { 
  fetchTasksFromFirestore,
  addTaskToFirestore,
  updateTaskCompletionInFirestore,
  addLibraryTaskToFirestore,
  fetchLibraryTasksFromFirestore,
  deleteLibraryTaskFromFirestore,
  deleteTaskFromFirestore,
  addTaskFromLibraryToFirestore 
} from './firebase';

function App() {
  const [tasks, setTasks] = useState([]);
  const [libraryTasks, setLibraryTasks] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showLibraryPopup, setShowLibraryPopup] = useState(false);

  // Lade Tasks aus Firestore
  useEffect(() => { 
    const fetchData = async () => {
      const fetchedTasks = await fetchTasksFromFirestore();
      setTasks(fetchedTasks);
    };
    fetchData();
  }, []);

  // Lade Library Tasks aus Firestore
  useEffect(() => {
    const fetchLibraryData = async () => {
      const fetchedLibraryTasks = await fetchLibraryTasksFromFirestore();
      setLibraryTasks(fetchedLibraryTasks);
    };
    fetchLibraryData();
  }, []);

  // Task hinzufügen
  const addTask = async (task) => {
    try {
      // Prüfen, ob der Task bereits existiert
      const isTaskAlreadyAdded = tasks.some(
        (existingTask) =>
          existingTask.text === task.text && existingTask.color === task.color
      );
  
      if (isTaskAlreadyAdded) {
        alert("Task is already in your list!");
        return;
      }
  
      // Task hinzufügen, falls er noch nicht existiert
      const taskId = await addTaskToFirestore(task);
      setTasks([...tasks, { ...task, id: taskId }]);
    } catch (e) {
      console.error("Error adding task: ", e);
    }
  };
  

  // Task zur Bibliothek hinzufügen
  const addToLibrary = async (task) => {
    try {
      const existingLibraryTasks = await fetchLibraryTasksFromFirestore();
      const isDuplicate = existingLibraryTasks.some(
        (libraryTask) =>
          libraryTask.text.toLowerCase() === task.text.toLowerCase() &&
          libraryTask.color === task.color
      );

      if (isDuplicate) {
        alert("Task already exists in the library!");
        return;
      }

      const taskId = await addLibraryTaskToFirestore(task);
      setLibraryTasks([...libraryTasks, { ...task, id: taskId }]);
    } catch (error) {
      console.error("Error adding task to library:", error);
    }
  };

  // Task abschließen
  const handleTaskCompletion = async (index) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[index];
    task.completed = !task.completed;
    setTasks(updatedTasks);
    await updateTaskCompletionInFirestore(task.id, task.completed);
  };

  // Task löschen
  const deleteTask = async (taskId) => {
    try {
      await deleteTaskFromFirestore(taskId);
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Alle Tasks löschen
  const deleteAllTasks = async () => {
    try {
      for (const task of tasks) {
        await deleteTask(task.id);
      }
      setTasks([]);
    } catch (error) {
      console.error("Error deleting all tasks:", error);
    }
  };

  // Erledigte Tasks löschen
  const deleteCompletedTasks = async () => {
    try {
      const completedTasks = tasks.filter((task) => task.completed);
      for (const task of completedTasks) {
        await deleteTask(task.id);
      }
      setTasks(tasks.filter((task) => !task.completed));
    } catch (error) {
      console.error("Error deleting completed tasks:", error);
    }
  };

  // Task aus der Bibliothek löschen
  const deleteFromLibrary = async (taskId) => {
    try {
      await deleteLibraryTaskFromFirestore(taskId);
      setLibraryTasks(libraryTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task from library:", error);
    }
  };

  const addTaskFromLibrary = async (libraryTask) => {
    try {
        const newTaskId = await addTaskFromLibraryToFirestore(libraryTask);
        setTasks([...tasks, { ...libraryTask, id: newTaskId }]); // Aktualisiere den State mit neuer ID
    } catch (e) {
        console.error("Fehler beim Hinzufügen aus der Library:", e);
    }
};


  return (
    <div className="App">
      <h1>Daily To Do's</h1>
      <div className="Buttons">
        <button onClick={() => setShowAddPopup(true)} id="add">Add</button>
        <button onClick={() => setShowLibraryPopup(true)} id="library">Library</button>
        <button onClick={deleteCompletedTasks} id="checked">Clear Checked</button>
        <button onClick={deleteAllTasks} id="clear_all">Clear All Tasks</button>
      </div>
      <ul>
        {tasks.map((task, index) => (
          <li key={task.id}>
            <p
              style={{
                backgroundColor: `var(--${task.color})`,
                boxShadow: `0 0 4px 4px var(--${task.color})`,
                opacity: task.completed ? 0.5 : 1,
              }}
              onClick={() => handleTaskCompletion(index)}
            >
              {task.text}
            </p>
          </li>
        ))}
      </ul>
      {showAddPopup && (
        <AddTaskPopup
          onClose={() => setShowAddPopup(false)}
          onAdd={addTask}
          onAddToLibrary={addToLibrary}
        />
      )}
      {showLibraryPopup && (
        <LibraryPopup
          tasks={libraryTasks}
          onClose={() => setShowLibraryPopup(false)}
          onAdd={(task) => addTaskFromLibrary(task)}
          onDelete={(task) => deleteFromLibrary(task.id)}
        />
      )}
    </div>
  );
}

function AddTaskPopup({ onClose, onAdd, onAddToLibrary }) {
  const [text, setText] = useState("");
  const [color, setColor] = useState("red");

  const handleAdd = () => {
    if (text.trim()) {
      onAdd({ text, color, completed: false });
      onClose();
    }
  };

  const handleAddToLibrary = () => {
    if (text.trim()) {
      onAddToLibrary({ text, color, completed: false });
      onClose();
    }
  };

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>Add Task</h2>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          id="task_input"
        />
        <div className="color-options">
          {["red", "blue", "green", "orange", "violet"].map((colorOption) => (
            <div
              key={colorOption}
              className={`color-circle ${color === colorOption ? "selected" : ""}`}
              style={{
                backgroundColor: `var(--${colorOption})`,
                boxShadow: color === colorOption ? `0 0 4px 4px var(--${colorOption})` : 'none', // Box-Shadow auf die ausgewählte Farbe anwenden
              }}
              onClick={() => setColor(colorOption)}
            ></div>
          ))}
        </div>
        <button onClick={handleAdd} id="add_task">Add to Tasks</button>
        <button onClick={handleAddToLibrary} id="add_library">Add to Library</button>
        <button onClick={onClose} id="cancel">Cancel</button>
      </div>
    </div>
  );
}

function LibraryPopup({ tasks, onClose, onAdd, onDelete }) {
  return (
    <div className="popup">
      <div className="popup-content">
        <h2>Library</h2>
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <div className="task_container">
                <p
                  style={{
                    backgroundColor: `var(--${task.color})`,
                  }}
                >
                  {task.text}
                </p>
                <div className="task_buttons">
                <button onClick={() => onAdd(task)} id="plus">
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button onClick={() => onDelete(task)} id="trash">
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={onClose} id="close">Close</button>
      </div>
    </div>
  );
}

export default App;
