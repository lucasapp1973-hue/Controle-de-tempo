export type SessionType = 'real' | 'demo';

let currentSessionType: SessionType = (sessionStorage.getItem('sessionType') as SessionType) || 'real';

export const sessionStore = {
  getSessionType(): SessionType {
    return currentSessionType;
  },
  setSessionType(type: SessionType) {
    currentSessionType = type;
    sessionStorage.setItem('sessionType', type);
    // Dispatch custom event to notify React components or display changes instantly
    window.dispatchEvent(new Event('sessionTypeChanged'));
  },
  isDemo(): boolean {
    return currentSessionType === 'demo';
  }
};

export const congregationStore = {
  getCongregation(): string {
    const urlParams = new URLSearchParams(window.location.search);
    const congreParam = urlParams.get('congre') || urlParams.get('congregacao');
    if (congreParam) {
      const sanitized = congreParam.trim();
      localStorage.setItem('selected_congregation', sanitized);
      return sanitized;
    }
    return localStorage.getItem('selected_congregation') || 'default';
  },
  setCongregation(name: string) {
    const sanitized = name.trim();
    if (sanitized) {
      localStorage.setItem('selected_congregation', sanitized);
    } else {
      localStorage.removeItem('selected_congregation');
    }
    
    // Update URL query parameter
    const url = new URL(window.location.href);
    if (sanitized && sanitized.toLowerCase() !== 'default') {
      url.searchParams.set('congre', sanitized);
    } else {
      url.searchParams.delete('congre');
      url.searchParams.delete('congregacao');
    }
    window.history.replaceState({}, '', url.toString());
    
    // Dispatch custom event to let sockets and firestore hooks re-subscribe instantly
    window.dispatchEvent(new Event('congregationChanged'));
  }
};

