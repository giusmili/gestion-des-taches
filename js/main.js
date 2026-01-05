import { initApp, updateTaskStatus, deleteTask } from './app.js';

window.addEventListener('DOMContentLoaded', () => {
    // Expose handlers for inline event attributes
    window.updateTaskStatus = updateTaskStatus;
    window.deleteTask = deleteTask;
    initApp();
});
