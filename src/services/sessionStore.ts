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
