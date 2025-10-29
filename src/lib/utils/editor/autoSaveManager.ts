const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export class AutoSaveManager {
  private intervalId: number | null = null;
  private saving = false;
  private lastSaved: Date | null = null;
  private onSaveCallback: () => Promise<void>;
  private shouldSaveCallback: () => boolean;

  constructor(onSave: () => Promise<void>, shouldSave: () => boolean) {
    this.onSaveCallback = onSave;
    this.shouldSaveCallback = shouldSave;
  }

  start(): void {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.autoSave();
    }, AUTO_SAVE_INTERVAL);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async autoSave(): Promise<void> {
    if (this.saving || !this.shouldSaveCallback()) {
      return;
    }

    try {
      this.saving = true;
      await this.onSaveCallback();
      this.lastSaved = new Date();
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      this.saving = false;
    }
  }

  async forceSave(): Promise<void> {
    if (this.saving) return;

    try {
      this.saving = true;
      await this.onSaveCallback();
      this.lastSaved = new Date();
    } finally {
      this.saving = false;
    }
  }

  isSaving(): boolean {
    return this.saving;
  }

  getLastSaved(): Date | null {
    return this.lastSaved;
  }

  setLastSaved(date: Date): void {
    this.lastSaved = date;
  }
}
