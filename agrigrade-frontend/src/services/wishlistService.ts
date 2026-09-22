export const wishlistService = {
  getWishlist(): number[] {
    try {
      const stored = localStorage.getItem('AGRIGRADE_WISHLIST');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  isWishlisted(listingId: number): boolean {
    return this.getWishlist().includes(listingId);
  },

  toggleWishlist(listingId: number): boolean {
    const current = this.getWishlist();
    let updated: number[];
    let isAdded = false;

    if (current.includes(listingId)) {
      updated = current.filter((id) => id !== listingId);
      isAdded = false;
    } else {
      updated = [...current, listingId];
      isAdded = true;
    }

    try {
      localStorage.setItem('AGRIGRADE_WISHLIST', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist wishlist:', e);
    }

    return isAdded;
  },
};
