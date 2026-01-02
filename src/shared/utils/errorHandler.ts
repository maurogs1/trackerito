/**
 * Utilidad para manejo estandarizado de errores en la aplicación
 */

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Extrae un mensaje legible de un error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'Ha ocurrido un error inesperado';
}

/**
 * Obtiene un mensaje de error amigable para el usuario basado en el tipo de error
 */
export function getUserFriendlyMessage(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  const errorStr = message.toLowerCase();
  
  // Errores de autenticación
  if (errorStr.includes('auth') || errorStr.includes('session') || errorStr.includes('user')) {
    if (errorStr.includes('not authenticated') || errorStr.includes('no user')) {
      return 'Debes iniciar sesión para realizar esta acción';
    }
    return 'Error de autenticación. Por favor, vuelve a iniciar sesión';
  }
  
  // Errores de red/conexión
  if (errorStr.includes('network') || errorStr.includes('connection') || errorStr.includes('fetch')) {
    return 'Error de conexión. Verifica tu internet e intenta nuevamente';
  }
  
  // Errores de Supabase específicos
  if (errorStr.includes('row-level security') || errorStr.includes('permission')) {
    return 'No tienes permiso para realizar esta acción';
  }
  
  if (errorStr.includes('foreign key') || errorStr.includes('constraint')) {
    return context === 'delete' 
      ? 'No se puede eliminar porque tiene datos relacionados'
      : 'Error al guardar. Verifica que los datos sean válidos';
  }
  
  if (errorStr.includes('unique') || errorStr.includes('duplicate')) {
    return 'Este elemento ya existe';
  }
  
  // Errores de validación
  if (errorStr.includes('invalid') || errorStr.includes('required')) {
    return 'Por favor completa todos los campos requeridos correctamente';
  }
  
  // Errores de contexto específicos
  if (context) {
    const contextMessages: Record<string, string> = {
      'expense': 'No se pudo guardar el gasto. Intenta nuevamente',
      'category': 'No se pudo guardar la categoría. Intenta nuevamente',
      'budget': 'No se pudo guardar el presupuesto. Intenta nuevamente',
      'goal': 'No se pudo guardar la meta. Intenta nuevamente',
      'bank': 'No se pudo guardar el banco. Intenta nuevamente',
      'creditCard': 'No se pudo guardar la tarjeta. Intenta nuevamente',
      'investment': 'No se pudo guardar la inversión. Intenta nuevamente',
      'debt': 'No se pudo guardar la deuda. Intenta nuevamente',
      'load': 'No se pudieron cargar los datos. Intenta nuevamente',
      'delete': 'No se pudo eliminar. Intenta nuevamente',
      'update': 'No se pudo actualizar. Intenta nuevamente',
    };
    
    if (contextMessages[context]) {
      return contextMessages[context];
    }
  }
  
  // Mensaje genérico con el mensaje original si es corto y útil
  if (message.length < 100) {
    return message;
  }
  
  return 'Ha ocurrido un error. Por favor intenta nuevamente';
}

/**
 * Crea un objeto de error estandarizado
 */
export function createAppError(
  error: unknown,
  context?: string,
  code?: string
): AppError {
  return {
    message: getUserFriendlyMessage(error, context),
    code,
    details: error,
  };
}

/**
 * Log de error con contexto
 */
export function logError(error: unknown, context?: string): void {
  const errorMessage = getErrorMessage(error);
  const contextStr = context ? `[${context}]` : '';
  console.error(`${contextStr} Error:`, errorMessage, error);
}
