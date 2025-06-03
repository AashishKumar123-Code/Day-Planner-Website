// Global variables for tasks and current date
let tasks = []; // Array to store all tasks
let currentDate = new Date();

// Get DOM elements
const currentDateDisplay = document.getElementById('currentDateDisplay');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const addTaskForm = document.getElementById('addTaskForm');
const taskTimeInput = document.getElementById('taskTime');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskList = document.getElementById('taskList');
const noTasksMessage = document.getElementById('noTasksMessage');

// Modal elements
const customModal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalInputGroup = document.getElementById('modalInputGroup');
const editTaskTimeInput = document.getElementById('editTaskTime');
const editTaskDescriptionInput = document.getElementById('editTaskDescription');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * This format is used for storing and comparing dates for tasks.
 * @param {Date} date - The date object to format.
 * @returns {string} The formatted date string (e.g., "2024-06-03").
 */
function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object into a readable display string (e.g., "Monday, June 3, 2024").
 * This is for user-facing display.
 * @param {Date} date - The date object to format.
 * @returns {string} The formatted display string.
 */
function formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Updates the displayed date in the UI and re-renders tasks for the new date.
 */
function displayCurrentDate() {
    currentDateDisplay.textContent = formatDisplayDate(currentDate);
    renderTasks(); // Re-render tasks for the newly selected date
}

/**
 * Changes the current day by a given offset (e.g., -1 for previous day, 1 for next day).
 * @param {number} offset - The number of days to add or subtract.
 */
function changeDay(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    displayCurrentDate();
}

/**
 * Saves the current tasks array to Local Storage.
 * The array is stringified to JSON before saving.
 */
function saveTasks() {
    try {
        localStorage.setItem('dayPlannerTasks', JSON.stringify(tasks));
        console.log("Tasks saved to Local Storage.");
    } catch (e) {
        console.error("Error saving tasks to Local Storage:", e);
        showModal("Storage Error", "Could not save tasks. Local storage might be full or unavailable.", null);
    }
}

/**
 * Loads tasks from Local Storage into the tasks array.
 * The retrieved string is parsed from JSON.
 */
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem('dayPlannerTasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            console.log("Tasks loaded from Local Storage.");
        }
    } catch (e) {
        console.error("Error loading tasks from Local Storage:", e);
        showModal("Storage Error", "Could not load tasks. Data might be corrupted.", null);
        tasks = []; // Reset tasks if loading fails
    }
}

/**
 * Renders the list of tasks for the currently selected date to the DOM.
 * Filters, sorts, and displays tasks from the `tasks` array.
 */
function renderTasks() {
    taskList.innerHTML = ''; // Clear existing tasks

    const formattedCurrentDate = formatDateToYYYYMMDD(currentDate);
    // Filter tasks that match the current date
    const tasksForCurrentDay = tasks.filter(task => task.date === formattedCurrentDate);

    // Sort tasks by time
    tasksForCurrentDay.sort((a, b) => a.time.localeCompare(b.time));

    if (tasksForCurrentDay.length === 0) {
        noTasksMessage.style.display = 'block'; // Show "No tasks" message
        return;
    } else {
        noTasksMessage.style.display = 'none'; // Hide "No tasks" message
    }

    tasksForCurrentDay.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        taskItem.setAttribute('data-id', task.id); // Store ID for easy access

        taskItem.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-details">
                    <span class="task-time">${task.time}</span>
                    <span class="task-description">${task.description}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" aria-label="Edit task"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" aria-label="Delete task"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        // Attach event listeners directly to the created elements
        taskItem.querySelector('input[type="checkbox"]').onchange = (e) => toggleTaskCompletion(task.id, e.target.checked);
        taskItem.querySelector('.edit-btn').onclick = () => showEditModal(task.id, task.time, task.description);
        taskItem.querySelector('.delete-btn').onclick = () => showConfirmationModal("Delete Task", "Are you sure you want to delete this task?", () => deleteTask(task.id));

        taskList.appendChild(taskItem);
    });
}

/**
 * Adds a new task to the `tasks` array, saves to local storage, and re-renders the list.
 * @param {Event} event - The form submission event.
 */
function addTask(event) {
    event.preventDefault(); // Prevent default form submission

    const time = taskTimeInput.value;
    const description = taskDescriptionInput.value.trim();
    const formattedDate = formatDateToYYYYMMDD(currentDate);

    if (!time || !description) {
        showModal("Validation Error", "Please fill in both time and description.", null);
        return;
    }

    const newTask = {
        id: Date.now().toString(), // Simple unique ID
        date: formattedDate,
        time: time,
        description: description,
        completed: false
    };

    tasks.push(newTask);
    saveTasks(); // Save after adding
    renderTasks(); // Re-render the task list to include the new task

    // Clear form inputs
    taskTimeInput.value = '';
    taskDescriptionInput.value = '';
}

/**
 * Toggles the completion status of a task in the `tasks` array, saves to local storage, and re-renders.
 * @param {string} taskId - The ID of the task to update.
 * @param {boolean} completed - The new completion status.
 */
function toggleTaskCompletion(taskId, completed) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = completed;
        saveTasks(); // Save after updating
        renderTasks(); // Re-render to update the visual state
    }
}

/**
 * Edits a task's time and description in the `tasks` array, saves to local storage, and re-renders.
 * @param {string} taskId - The ID of the task to edit.
 * @param {string} newTime - The new time for the task.
 * @param {string} newDescription - The new description for the task.
 */
function editTask(taskId, newTime, newDescription) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].time = newTime;
        tasks[taskIndex].description = newDescription;
        saveTasks(); // Save after updating
        renderTasks(); // Re-render to show updated task
    }
}

/**
 * Deletes a task from the `tasks` array, saves to local storage, and re-renders.
 * @param {string} taskId - The ID of the task to delete.
 */
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks(); // Save after deleting
    renderTasks(); // Re-render after deletion
}

/**
 * Shows a generic custom modal.
 * @param {string} title - The title for the modal.
 * @param {string} message - The message content for the modal.
 * @param {Function} onConfirmCallback - Callback function to execute on confirm.
 * @param {boolean} showInputs - Whether to show input fields in the modal.
 * @param {string} initialTime - Initial time for edit input.
 * @param {string} initialDescription - Initial description for edit input.
 */
function showModal(title, message, onConfirmCallback, showInputs = false, initialTime = '', initialDescription = '') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (showInputs) {
        modalInputGroup.style.display = 'block';
        editTaskTimeInput.value = initialTime;
        editTaskDescriptionInput.value = initialDescription;
    } else {
        modalInputGroup.style.display = 'none';
    }

    // Clear previous listeners to prevent multiple calls
    modalConfirmBtn.onclick = null;
    modalCancelBtn.onclick = null;

    modalConfirmBtn.onclick = () => {
        if (onConfirmCallback) {
            onConfirmCallback();
        }
        hideModal();
    };

    modalCancelBtn.onclick = () => {
        hideModal();
    };

    customModal.classList.add('active'); // Show modal with transition
}

/**
 * Hides the custom modal.
 */
function hideModal() {
    customModal.classList.remove('active'); // Hide modal with transition
}

/**
 * Shows a confirmation modal.
 * @param {string} title - The title for the modal.
 * @param {string} message - The message content for the modal.
 * @param {Function} onConfirmCallback - Callback function to execute on confirm.
 */
function showConfirmationModal(title, message, onConfirmCallback) {
    showModal(title, message, onConfirmCallback, false);
}

/**
 * Shows an edit modal for a task.
 * @param {string} taskId - The ID of the task being edited.
 * @param {string} currentTime - The current time of the task.
 * @param {string} currentDescription - The current description of the task.
 */
function showEditModal(taskId, currentTime, currentDescription) {
    showModal("Edit Task", "Update the task details:", () => {
        const newTime = editTaskTimeInput.value;
        const newDescription = editTaskDescriptionInput.value.trim();
        if (newTime && newDescription) {
            editTask(taskId, newTime, newDescription);
        } else {
            showModal("Validation Error", "Time and description cannot be empty.", null);
        }
    }, true, currentTime, currentDescription);
}

// Event Listeners
prevDayBtn.addEventListener('click', () => changeDay(-1));
nextDayBtn.addEventListener('click', () => changeDay(1));
addTaskForm.addEventListener('submit', addTask);

// Initialize on window load
window.onload = function() {
    loadTasks(); // Load tasks from local storage on page load
    displayCurrentDate(); // Display initial date
    renderTasks(); // Initial render of tasks for today
};
