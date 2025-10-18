import { useState, useEffect } from 'react';
import useStore, { FamilyMember, Todo } from '../store';

function EditTodoForm({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [dueDate, setDueDate] = useState(todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : '');
  const [assigneeId, setAssigneeId] = useState(todo.assignee_id?.toString() || '');
  const [formError, setFormError] = useState('');
  const { updateTodoApi, familyMembers, fetchFamilyMembers } = useStore();

  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    const updates: Partial<Todo> = {
      title,
      description: description || undefined,
      due_date: dueDate || undefined,
      assignee_id: assigneeId ? parseInt(assigneeId) : undefined,
    };
    const result = await updateTodoApi(todo.id, updates);
    if (result.error) {
      setFormError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-readable flex items-center">
              <svg className="h-6 w-6 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Task
            </h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-readable transition duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {formError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">{formError}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-readable mb-2">
                Task Title *
              </label>
              <input
                id="title"
                type="text"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-readable mb-2">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-readable mb-2">
                Due Date
              </label>
              <input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-readable mb-2">
                Assign to
              </label>
              <select
                id="assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="input-field"
              >
                <option value="">Unassigned</option>
                {familyMembers && familyMembers.map((member: FamilyMember) => (
                  <option key={member.id} value={member.id}>{member.email}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update Task
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditTodoForm;
