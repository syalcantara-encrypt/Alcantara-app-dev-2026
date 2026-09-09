// ==========================================
// 1. STATE
// ==========================================

// The state stores all task data in one place.
// It serves as the single source of truth for the application.

let state = {
    tasks: []
};


// ==========================================
// 2. LOCAL STORAGE KEY
// ==========================================

// This is the name used to store the tasks
// inside the browser's Local Storage.

const STORAGE_KEY = "todoTasks";


// ==========================================
// 3. GET HTML ELEMENTS
// ==========================================

// Get the form from the HTML.
const taskForm =
    document.getElementById("taskForm");


// Get the text input from the HTML.
const taskInput =
    document.getElementById("taskInput");


// Get the task list from the HTML.
const taskList =
    document.getElementById("taskList");


// Get the error message element.
const errorMessage =
    document.getElementById("errorMessage");


// Get the task counter.
const taskCount =
    document.getElementById("taskCount");


// Get the Delete All button.
const deleteAllBtn =
    document.getElementById("deleteAllBtn");


// ==========================================
// 4. SAVE TASKS
// ==========================================

// This function saves the current tasks
// from the state into Local Storage.

function saveTasks() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.tasks)
    );

}


// ==========================================
// 5. LOAD TASKS
// ==========================================

// This function loads previously saved tasks
// from Local Storage when the application starts.

function loadTasks() {

    const savedTasks =
        localStorage.getItem(STORAGE_KEY);


    // Check if saved tasks exist.
    if (savedTasks) {

        // Convert the stored string back into an array.
        state.tasks =
            JSON.parse(savedTasks);

    }

}


// ==========================================
// 6. RENDER TASKS
// ==========================================

// The render function updates the webpage
// based on the current state.

function render() {

    // Clear the existing task list
    // before displaying the current state.
    taskList.innerHTML = "";


    // Loop through every task in the state.
    state.tasks.forEach(function(task) {


        // --------------------------------------
        // CREATE TASK CONTAINER
        // --------------------------------------

        // Create a new list item for the task.
        const listItem =
            document.createElement("li");

        listItem.className =
            "task-item";


        // --------------------------------------
        // CREATE CHECKBOX
        // --------------------------------------

        // Create a checkbox for marking
        // the task as completed.
        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className =
            "complete-checkbox";


        // Set the checkbox according to
        // the task's completed state.
        checkbox.checked =
            task.completed;


        // Store the task ID inside the checkbox.
        checkbox.dataset.id =
            task.id;


        // --------------------------------------
        // CREATE TASK TITLE
        // --------------------------------------

        // Create an element for the task name.
        const title =
            document.createElement("span");

        title.className =
            "task-title";


        // Display the task title.
        title.textContent =
            task.title;


        // If the task is completed,
        // add the completed CSS class.
        if (task.completed) {

            title.classList.add("completed");

        }


        // --------------------------------------
        // CREATE DELETE BUTTON
        // --------------------------------------

        // Create a delete button for the task.
        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "delete-btn";

        deleteButton.textContent = "×";


        // Store the task ID inside the button.
        deleteButton.dataset.id =
            task.id;


        // --------------------------------------
        // ADD ELEMENTS TO TASK
        // --------------------------------------

        // Add the checkbox to the task item.
        listItem.appendChild(checkbox);


        // Add the task title.
        listItem.appendChild(title);


        // Add the delete button.
        listItem.appendChild(deleteButton);


        // Add the completed task item
        // to the task list.
        taskList.appendChild(listItem);

    });


    // ======================================
    // UPDATE TASK COUNT
    // ======================================

    // Get the total number of tasks.
    const totalTasks =
        state.tasks.length;


    // Count how many tasks are completed.
    const completedTasks =
        state.tasks.filter(function(task) {

            return task.completed;

        }).length;


    // Display the updated task count.
    taskCount.textContent =
        `${totalTasks} tasks • ${completedTasks} done`;


    // Disable Delete All when there are no tasks.
    deleteAllBtn.disabled =
        totalTasks === 0;

}


// ==========================================
// 7. CREATE TASK
// ==========================================

// Listen for the form's submit event.
taskForm.addEventListener(
    "submit",
    function(event) {


        // Prevent the browser from refreshing
        // the page when the form is submitted.
        event.preventDefault();


        // Get the user's input.
        // trim() removes unnecessary spaces.
        const taskTitle =
            taskInput.value.trim();


        // ======================================
        // VALIDATION
        // ======================================

        // Check if the input is empty.
        if (taskTitle === "") {

            // Display an error message.
            errorMessage.textContent =
                "Please enter a task.";

            // Stop the function.
            return;

        }


        // Clear the error message
        // when the input is valid.
        errorMessage.textContent = "";


        // ======================================
        // CREATE TASK OBJECT
        // ======================================

        // Create a new task object.
        const newTask = {

            // Give the task a unique ID.
            id: Date.now(),

            // Store the task name.
            title: taskTitle,

            // New tasks are incomplete by default.
            completed: false

        };


        // ======================================
        // UPDATE STATE
        // ======================================

        // Add the new task to the state.
        state.tasks.push(newTask);


        // ======================================
        // SAVE
        // ======================================

        // Save the updated state to Local Storage.
        saveTasks();


        // ======================================
        // UPDATE UI
        // ======================================

        // Render the updated state on the screen.
        render();


        // Clear the input field.
        taskInput.value = "";


        // Put the cursor back into the input.
        taskInput.focus();

    }
);


// ==========================================
// 8. MARK TASK AS DONE
// ==========================================

// Listen for changes inside the task list.
taskList.addEventListener(
    "change",
    function(event) {


        // Check if the changed element
        // is a task completion checkbox.
        if (
            event.target.classList.contains(
                "complete-checkbox"
            )
        ) {


            // Get the task ID from the checkbox.
            const taskId =
                Number(event.target.dataset.id);


            // Find the matching task
            // inside the state.
            const task =
                state.tasks.find(function(task) {

                    return task.id === taskId;

                });


            // Check if the task was found.
            if (task) {


                // Update the completed property
                // based on the checkbox.
                task.completed =
                    event.target.checked;


                // Save the updated task.
                saveTasks();


                // Update the webpage.
                render();

            }

        }

    }
);


// ==========================================
// 9. DELETE ONE TASK
// ==========================================

// Listen for clicks inside the task list.
taskList.addEventListener(
    "click",
    function(event) {


        // Check if the clicked element
        // is an individual delete button.
        if (
            event.target.classList.contains(
                "delete-btn"
            )
        ) {


            // Get the ID of the task to delete.
            const taskId =
                Number(event.target.dataset.id);


            // filter() creates a new array
            // that keeps every task except
            // the selected task.
            state.tasks =
                state.tasks.filter(function(task) {

                    return task.id !== taskId;

                });


            // Save the updated state.
            saveTasks();


            // Update the webpage.
            render();

        }

    }
);


// ==========================================
// 10. DELETE ALL TASKS
// ==========================================

// Listen for a click on the Delete All button.
deleteAllBtn.addEventListener(
    "click",
    function() {


        // If there are no tasks,
        // there is nothing to delete.
        if (state.tasks.length === 0) {

            return;

        }


        // ======================================
        // SHOW LOADING STATE
        // ======================================

        // Disable the button while deleting.
        deleteAllBtn.disabled = true;


        // Change the button text
        // to show that the operation is running.
        deleteAllBtn.textContent =
            "Deleting...";


        // ======================================
        // ASYNCHRONOUS OPERATION
        // ======================================

        // setTimeout simulates an asynchronous
        // operation that happens after 2 seconds.
        setTimeout(function() {


            // ==================================
            // CLEAR STATE
            // ==================================

            // Remove all tasks from the state.
            state.tasks = [];


            // ==================================
            // CLEAR LOCAL STORAGE
            // ==================================

            // Remove the saved tasks
            // from Local Storage.
            localStorage.removeItem(
                STORAGE_KEY
            );


            // ==================================
            // UPDATE UI
            // ==================================

            // Render the empty state.
            render();


            // Enable the Delete All button again.
            deleteAllBtn.disabled = false;


            // Restore the original button text.
            deleteAllBtn.textContent =
                "Delete All";


        }, 2000);

    }
);


// ==========================================
// 11. INITIALIZE APP
// ==========================================

// Load previously saved tasks
// when the application starts.
loadTasks();


// Display the loaded tasks on the webpage.
render();