// Helper functions to manage favorites in localStorage
const FAVORITES_KEY = 'video_favorites';

export const getFavorites = (): string[] => {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error reading favorites:', error);
    return [];
  }
};

export const addFavorite = (videoId: string) => {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(videoId)) {
      favorites.push(videoId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
};

export const removeFavorite = (videoId: string) => {
  try {
    const favorites = getFavorites();
    const newFavorites = favorites.filter(id => id !== videoId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

export const isFavorite = (videoId: string): boolean => {
  try {
    const favorites = getFavorites();
    return favorites.includes(videoId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};