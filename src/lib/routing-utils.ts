// src/lib/routing-utils.ts

export const MEDELLIN_COORDS = { lat: 6.25184, lng: -75.56359 };

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distancia en línea recta
  return distance * 1.5; // Multiplicador para aproximar ruta de montañas (1.5x)
}

export function estimateDeliveryTime(roadDistanceKm: number) {
  // Asumiendo velocidad promedio realista en montañas (aprox 35 km/h por tráfico y curvas)
  const travelHours = roadDistanceKm / 35;
  
  if (travelHours < 1) {
    const minutes = Math.round(travelHours * 60);
    return {
      text: `${minutes} minutos aprox.`,
      days: 0
    };
  } else if (travelHours < 24) {
    const hours = Math.floor(travelHours);
    const minutes = Math.round((travelHours - hours) * 60);
    return {
      text: `${hours}h ${minutes}m de trayecto`,
      days: 0
    };
  } else {
    // Viajes de más de 24 horas de conducción pura (ej. a la costa o zonas extremas)
    const days = Math.floor(travelHours / 24);
    const remainingHours = Math.round(travelHours % 24);
    return {
      text: `${days} día(s) y ${remainingHours}h de trayecto`,
      days: days
    };
  }
}
