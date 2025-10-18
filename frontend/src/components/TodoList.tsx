import useStore, { Todo } from '../store';

function filterTodos(todos: Todo[], searchText: string, filterAssignee: string, filterCompleted: string) {
  return todos.filter(todo => {
    // Search filter
    if (searchText && !todo.title.toLowerCase().includes(searchText.toLowerCase()) &&
        !todo.description?.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    // Assignee filter
    if (filterAssignee && todo.assignee_email !== filterAssignee) {
      return false;
    }

    // Completion filter
    if (filterCompleted === 'completed' && !todo.completed) {
      return false;
    }
    if (filterCompleted === 'pending' && todo.completed) {
      return false;
    }

    return true;
  });
}

function TodoList({ todos, onEdit }: { todos: Todo[]; onEdit: (todo: Todo) => void }) {
  const { updateTodoApi, deleteTodoApi, searchText, filterAssignee, filterCompleted } = useStore();

  const filteredTodos = filterTodos(todos, searchText, filterAssignee, filterCompleted);

  const toggleComplete = (id: number, completed: boolean) => {
    updateTodoApi(id, { completed: !completed });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="space-y-4">
      {filteredTodos.length === 0 ? (
        <div className="card text-center py-20">
          <div className="mb-8">
            <svg className="h-24 w-24 text-accent mx-auto opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-readable mb-4">No tasks found</h3>
          <p className="text-muted text-lg max-w-md mx-auto">Create your first family task or adjust your filters to see existing tasks.</p>
        </div>
      ) : (
        filteredTodos.map(todo => (
          <div key={todo.id} className="todo-item group hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-5 flex-1">
                <button
                  onClick={() => toggleComplete(todo.id, todo.completed)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 hover:scale-110 ${
                    todo.completed
                      ? 'bg-success border-success text-white shadow-md'
                      : 'border-slate-300 dark:border-slate-600 hover:border-accent hover:shadow-md'
                  }`}
                  aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {todo.completed && (
                    <svg className="w-5 h-5 m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xl font-semibold leading-tight mb-2 ${
                    todo.completed
                      ? 'line-through text-muted'
                      : 'text-readable group-hover:text-accent transition-colors duration-200'
                  }`}>
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p className={`text-base mt-3 leading-relaxed ${
                      todo.completed ? 'text-muted' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {todo.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-8 mt-5">
                    <div className="flex items-center text-sm">
                      <svg className="h-5 w-5 text-accent mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`font-medium ${
                        todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed
                          ? 'text-error'
                          : 'text-muted'
                      }`}>
                        {formatDate(todo.due_date)}
                      </span>
                    </div>
                    {todo.assignee_email && (
                      <div className="flex items-center text-sm">
                        <svg className="h-5 w-5 text-accent mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-muted font-medium">{todo.assignee_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => onEdit(todo)}
                  className="p-2.5 text-accent hover:text-white hover:bg-accent rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 hover:scale-105"
                  title="Edit task"
                  aria-label="Edit task"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteTodoApi(todo.id)}
                  className="p-2.5 text-error hover:text-white hover:bg-error rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 hover:scale-105"
                  title="Delete task"
                  aria-label="Delete task"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default TodoList;
