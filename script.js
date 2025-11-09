const API_URL = 'http://localhost:3000/todos'
const list = document.getElementById('todoList')
const input = document.getElementById('todoInput')
const addBtn = document.getElementById('addBtn')
const status = document.getElementById('status')

let isOnline = false

async function checkServer() {
	try {
		await fetch(API_URL)
		isOnline = true
		status.textContent = 'Server connected'
		status.classList.remove('offline')
	} catch {
		isOnline = false
		status.textContent = 'Server offline. Showing last saved ToDos.'
		status.classList.add('offline')
	}
}

async function loadTodos() {
	await checkServer()
	list.innerHTML = ''
	let todos = []

	if (isOnline) {
		try {
			const res = await fetch(API_URL)
			todos = await res.json()
			localStorage.setItem('todosBackup', JSON.stringify(todos.slice(-5)))
		} catch {
			todos = JSON.parse(localStorage.getItem('todosBackup') || '[]')
		}
	} else {
		todos = JSON.parse(localStorage.getItem('todosBackup') || '[]')
	}

	todos.forEach(render)
}

function render(todo) {
	const li = document.createElement('li')
	li.className = todo.isCompleted ? 'completed' : ''

	const checkbox = document.createElement('input')
	checkbox.type = 'checkbox'
	checkbox.checked = todo.isCompleted

	const span = document.createElement('span')
	span.textContent = todo.title

	const delBtn = document.createElement('button')
	delBtn.textContent = 'Delete'

	checkbox.addEventListener('change', async () => {
		todo.isCompleted = checkbox.checked
		li.classList.toggle('completed', checkbox.checked)
		await toggleTodo(todo)
	})

	delBtn.addEventListener('click', async () => {
		await deleteTodo(todo)
		li.remove()
	})

	li.append(checkbox, span, delBtn)
	list.appendChild(li)
}

addBtn.addEventListener('click', async () => {
	const title = input.value.trim()
	if (!title) return alert('Please enter text!')

	const newTodo = { title, isCompleted: false }

	if (isOnline) {
		try {
			const res = await fetch(API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newTodo),
			})
			const todo = await res.json()
			render(todo)
			saveOffline(todo)
		} catch {
			saveOffline(newTodo)
			render(newTodo)
		}
	} else {
		saveOffline(newTodo)
		render(newTodo)
	}

	input.value = ''
})

async function toggleTodo(todo) {
	const updatedTodo = {
		id: todo.id,
		title: todo.title,
		isCompleted: todo.isCompleted,
	}

	if (isOnline && todo.id) {
		try {
			await fetch(`${API_URL}/${todo.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedTodo),
			})
		} catch {
			saveOffline(updatedTodo)
		}
	} else {
		saveOffline(updatedTodo)
	}

	updateLocalTodo(updatedTodo)
}

async function deleteTodo(todo) {
	if (isOnline && todo.id) {
		try {
			await fetch(`${API_URL}/${todo.id}`, { method: 'DELETE' })
		} catch {
			removeOffline(todo.title)
		}
	} else {
		removeOffline(todo.title)
	}
}

function saveOffline(todo) {
	const todos = JSON.parse(localStorage.getItem('todosBackup') || '[]')
	const updated = [...todos.filter(t => t.title !== todo.title), todo].slice(-5)
	localStorage.setItem('todosBackup', JSON.stringify(updated))
}

function removeOffline(title) {
	const todos = JSON.parse(localStorage.getItem('todosBackup') || '[]')
	const updated = todos.filter(t => t.title !== title)
	localStorage.setItem('todosBackup', JSON.stringify(updated))
}

function updateLocalTodo(todo) {
	const todos = JSON.parse(localStorage.getItem('todosBackup') || '[]')
	const index = todos.findIndex(t => t.title === todo.title)
	if (index > -1) {
		todos[index] = todo
	} else {
		todos.push(todo)
	}
	localStorage.setItem('todosBackup', JSON.stringify(todos.slice(-5)))
}

loadTodos()
