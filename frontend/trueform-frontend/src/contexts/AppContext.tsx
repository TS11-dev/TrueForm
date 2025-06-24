import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FormFile, EditorState, LibraryState, ExecutionState } from '../types/form';
import { createEmptyForm, saveToLocalStorage, loadFromLocalStorage } from '../lib/utils';

// App state interface
interface AppState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeTab: 'editor' | 'library' | 'executions' | 'analytics';
  editor: EditorState;
  library: LibraryState;
  execution: ExecutionState;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
}

// Action types
type AppAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_TAB'; payload: 'editor' | 'library' | 'executions' | 'analytics' }
  | { type: 'SET_CURRENT_FORM'; payload: FormFile | null }
  | { type: 'SET_FORM_DIRTY'; payload: boolean }
  | { type: 'SET_VALIDATION_RESULT'; payload: any }
  | { type: 'SET_SELECTED_NODES'; payload: string[] }
  | { type: 'SET_SELECTED_RELATIONS'; payload: string[] }
  | { type: 'SET_VIEWPORT'; payload: { x: number; y: number; zoom: number } }
  | { type: 'SET_LIBRARY_SEARCH'; payload: string }
  | { type: 'SET_LIBRARY_FILTERS'; payload: Partial<LibraryState['filters']> }
  | { type: 'SET_LIBRARY_SORT'; payload: { sortBy: LibraryState['sortBy']; sortOrder: LibraryState['sortOrder'] } }
  | { type: 'SET_EXECUTION_PARAMETERS'; payload: Record<string, any> }
  | { type: 'SET_EXECUTION_MODE'; payload: ExecutionState['mode'] }
  | { type: 'SET_EXECUTION_RESULT'; payload: ExecutionState['currentExecution'] }
  | { type: 'ADD_EXECUTION_TO_HISTORY'; payload: ExecutionState['currentExecution'] }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// Initial state
const initialState: AppState = {
  theme: loadFromLocalStorage('theme', 'dark'),
  sidebarCollapsed: loadFromLocalStorage('sidebarCollapsed', false),
  activeTab: 'editor',
  editor: {
    currentForm: null,
    isDirty: false,
    isValidating: false,
    validationResult: null,
    selectedNodes: [],
    selectedRelations: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  },
  library: {
    forms: [],
    searchQuery: '',
    filters: {
      tags: [],
      author: '',
      dateRange: [null, null]
    },
    sortBy: 'updated_at',
    sortOrder: 'desc'
  },
  execution: {
    isExecuting: false,
    currentExecution: null,
    executionHistory: loadFromLocalStorage('executionHistory', []),
    parameters: {},
    mode: 'adaptive'
  },
  notifications: []
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_THEME':
      saveToLocalStorage('theme', action.payload);
      return { ...state, theme: action.payload };

    case 'TOGGLE_SIDEBAR':
      const collapsed = !state.sidebarCollapsed;
      saveToLocalStorage('sidebarCollapsed', collapsed);
      return { ...state, sidebarCollapsed: collapsed };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_CURRENT_FORM':
      return {
        ...state,
        editor: {
          ...state.editor,
          currentForm: action.payload,
          isDirty: false,
          selectedNodes: [],
          selectedRelations: []
        }
      };

    case 'SET_FORM_DIRTY':
      return {
        ...state,
        editor: { ...state.editor, isDirty: action.payload }
      };

    case 'SET_VALIDATION_RESULT':
      return {
        ...state,
        editor: {
          ...state.editor,
          validationResult: action.payload,
          isValidating: false
        }
      };

    case 'SET_SELECTED_NODES':
      return {
        ...state,
        editor: { ...state.editor, selectedNodes: action.payload }
      };

    case 'SET_SELECTED_RELATIONS':
      return {
        ...state,
        editor: { ...state.editor, selectedRelations: action.payload }
      };

    case 'SET_VIEWPORT':
      return {
        ...state,
        editor: { ...state.editor, viewport: action.payload }
      };

    case 'SET_LIBRARY_SEARCH':
      return {
        ...state,
        library: { ...state.library, searchQuery: action.payload }
      };

    case 'SET_LIBRARY_FILTERS':
      return {
        ...state,
        library: {
          ...state.library,
          filters: { ...state.library.filters, ...action.payload }
        }
      };

    case 'SET_LIBRARY_SORT':
      return {
        ...state,
        library: {
          ...state.library,
          sortBy: action.payload.sortBy,
          sortOrder: action.payload.sortOrder
        }
      };

    case 'SET_EXECUTION_PARAMETERS':
      return {
        ...state,
        execution: { ...state.execution, parameters: action.payload }
      };

    case 'SET_EXECUTION_MODE':
      return {
        ...state,
        execution: { ...state.execution, mode: action.payload }
      };

    case 'SET_EXECUTION_RESULT':
      return {
        ...state,
        execution: {
          ...state.execution,
          currentExecution: action.payload,
          isExecuting: false
        }
      };

    case 'ADD_EXECUTION_TO_HISTORY':
      if (!action.payload) return state;
      const newHistory = [action.payload, ...state.execution.executionHistory].slice(0, 50); // Keep last 50
      saveToLocalStorage('executionHistory', newHistory);
      return {
        ...state,
        execution: { ...state.execution, executionHistory: newHistory }
      };

    case 'ADD_NOTIFICATION':
      const notification: Notification = {
        ...action.payload,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      return {
        ...state,
        notifications: [notification, ...state.notifications]
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };

    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Custom hooks for specific state slices
export const useTheme = () => {
  const { state, dispatch } = useAppContext();
  
  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const toggleTheme = () => {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
  };

  return { theme: state.theme, setTheme, toggleTheme };
};

export const useSidebar = () => {
  const { state, dispatch } = useAppContext();
  
  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  return { 
    collapsed: state.sidebarCollapsed, 
    toggleSidebar 
  };
};

export const useActiveTab = () => {
  const { state, dispatch } = useAppContext();
  
  const setActiveTab = (tab: AppState['activeTab']) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  return { 
    activeTab: state.activeTab, 
    setActiveTab 
  };
};

export const useEditor = () => {
  const { state, dispatch } = useAppContext();
  
  const setCurrentForm = (form: FormFile | null) => {
    dispatch({ type: 'SET_CURRENT_FORM', payload: form });
  };

  const createNewForm = () => {
    const newForm = createEmptyForm();
    setCurrentForm(newForm);
  };

  const setFormDirty = (dirty: boolean) => {
    dispatch({ type: 'SET_FORM_DIRTY', payload: dirty });
  };

  const setValidationResult = (result: any) => {
    dispatch({ type: 'SET_VALIDATION_RESULT', payload: result });
  };

  const setSelectedNodes = (nodeIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_NODES', payload: nodeIds });
  };

  const setSelectedRelations = (relationIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_RELATIONS', payload: relationIds });
  };

  const setViewport = (viewport: { x: number; y: number; zoom: number }) => {
    dispatch({ type: 'SET_VIEWPORT', payload: viewport });
  };

  return {
    ...state.editor,
    setCurrentForm,
    createNewForm,
    setFormDirty,
    setValidationResult,
    setSelectedNodes,
    setSelectedRelations,
    setViewport
  };
};

export const useNotifications = () => {
  const { state, dispatch } = useAppContext();
  
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Auto-hide notifications after 5 seconds unless explicitly disabled
    if (notification.autoHide !== false) {
      setTimeout(() => {
        removeNotification(notification.title); // Use title as temporary ID
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const showSuccess = (title: string, message: string) => {
    addNotification({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    addNotification({ type: 'error', title, message, autoHide: false });
  };

  const showWarning = (title: string, message: string) => {
    addNotification({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message: string) => {
    addNotification({ type: 'info', title, message });
  };

  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
