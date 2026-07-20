/**
 * Formatea una hora "HH:MM:SS" o similar a formato amigable "hh:mm a".
 */
export const formatTime = (timeStr?: string): string => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'p. m.' : 'a. m.';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const displayMin = m < 10 ? `0${m}` : m;
    return `${displayHour}:${displayMin} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

/**
 * Formatea una fecha ISO o "YYYY-MM-DD" a un formato largo en español.
 * Ejemplo: "Domingo 16 de agosto de 2026"
 */
export const formatDateLong = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    // Si contiene 'T', es un ISO string completo
    const dateObj = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    
    // Nombres de los días de la semana y meses en español
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const dayName = days[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthName = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${dayName} ${dayNum} de ${monthName} de ${year}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Formatea una fecha/hora completa de auditoría a español legible.
 */
export const formatDateTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return '';
  try {
    const dateObj = new Date(dateTimeStr);
    return dateObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (e) {
    return dateTimeStr;
  }
};
