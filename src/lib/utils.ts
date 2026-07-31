export function formatPrice(price: number): string {
  return `₹${price.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-700 bg-yellow-100';
    case 'accepted':
      return 'text-blue-700 bg-blue-100';
    case 'preparing':
      return 'text-orange-700 bg-orange-100';
    case 'completed':
      return 'text-green-700 bg-green-100';
    case 'rejected':
      return 'text-red-700 bg-red-100';
    case 'cancelled':
      return 'text-gray-700 bg-gray-200';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Order Received';
    case 'accepted':
      return 'Accepted';
    case 'preparing':
      return 'Preparing';
    case 'completed':
      return 'Delivered';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function generateOrderShortId(id: string): string {
  return id.split('-')[0].toUpperCase();
}
