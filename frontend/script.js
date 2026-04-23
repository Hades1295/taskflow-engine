const API_TASKS = "http://localhost:3000/tasks";
const API_AI = "http://localhost:3000/ai";

async function generateTasks() {
  const brd = document.getElementById("brd").value;

  await fetch(`${API_AI}/process-brd`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brd }),
  });

  loadTasks();
}

async function loadTasks() {
  const res = await fetch(API_TASKS);
  const tasks = await res.json();

  const container = document.getElementById("tasks");
  container.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";

    div.innerHTML = `
      <b>${task.title}</b><br/>
      ${task.description}<br/>
      Priority: ${task.priority}<br/>
      Hours: ${task.estimatedHours}
    `;

    container.appendChild(div);
  });
}

async function refineTasks() {
  const instruction = document.getElementById("instruction").value;

  await fetch(`${API_AI}/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction }),
  });

  loadTasks();
}

