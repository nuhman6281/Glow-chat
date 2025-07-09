// Sound Management System for Glow Chat
// Handles different types of notifications and audio feedback

export interface SoundConfig {
  enabled: boolean;
  volume: number;
  messageSound: string;
  callSound: string;
  notificationSound: string;
  typingSound: string;
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private config: SoundConfig = {
    enabled: true,
    volume: 0.7,
    messageSound: "message",
    callSound: "call",
    notificationSound: "notification",
    typingSound: "typing",
  };

  constructor() {
    this.initializeAudioContext();
    this.loadSounds();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn("AudioContext not supported:", error);
    }
  }

  private loadSounds() {
    // Preload common sounds
    const soundFiles = {
      message: "/sounds/message.mp3",
      call: "/sounds/call.mp3",
      notification: "/sounds/notification.mp3",
      typing: "/sounds/typing.mp3",
      ringtone1: "/sounds/ringtone1.mp3",
      ringtone2: "/sounds/ringtone2.mp3",
      ringtone3: "/sounds/ringtone3.mp3",
      message_sent: "/sounds/message_sent.mp3",
      message_received: "/sounds/message_received.mp3",
      call_answered: "/sounds/call_answered.mp3",
      call_ended: "/sounds/call_ended.mp3",
      call_missed: "/sounds/call_missed.mp3",
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.volume = this.config.volume;
      this.sounds.set(name, audio);
    });
  }

  public setConfig(config: Partial<SoundConfig>) {
    this.config = { ...this.config, ...config };
    
    // Update volume for all loaded sounds
    this.sounds.forEach((audio) => {
      audio.volume = this.config.volume;
    });
  }

  public getConfig(): SoundConfig {
    return { ...this.config };
  }

  public async playSound(soundName: string): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const audio = this.sounds.get(soundName);
      if (audio) {
        // Reset audio to beginning
        audio.currentTime = 0;
        
        // Resume audio context if suspended
        if (this.audioContext?.state === "suspended") {
          await this.audioContext.resume();
        }
        
        await audio.play();
      } else {
        console.warn(`Sound "${soundName}" not found`);
      }
    } catch (error) {
      console.error(`Failed to play sound "${soundName}":`, error);
    }
  }

  public async playMessageSound(): Promise<void> {
    await this.playSound(this.config.messageSound);
  }

  public async playCallSound(): Promise<void> {
    await this.playSound(this.config.callSound);
  }

  public async playNotificationSound(): Promise<void> {
    await this.playSound(this.config.notificationSound);
  }

  public async playTypingSound(): Promise<void> {
    await this.playSound(this.config.typingSound);
  }

  public async playMessageSent(): Promise<void> {
    await this.playSound("message_sent");
  }

  public async playMessageReceived(): Promise<void> {
    await this.playSound("message_received");
  }

  public async playCallAnswered(): Promise<void> {
    await this.playSound("call_answered");
  }

  public async playCallEnded(): Promise<void> {
    await this.playSound("call_ended");
  }

  public async playCallMissed(): Promise<void> {
    await this.playSound("call_missed");
  }

  public async playRingtone(ringtoneName: string = "ringtone1"): Promise<void> {
    await this.playSound(ringtoneName);
  }

  public stopAllSounds(): void {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  public stopSound(soundName: string): void {
    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((audio) => {
      audio.volume = this.config.volume;
    });
  }

  public enable(): void {
    this.config.enabled = true;
  }

  public disable(): void {
    this.config.enabled = false;
    this.stopAllSounds();
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getVolume(): number {
    return this.config.volume;
  }

  // Test sound functionality
  public async testSound(soundName: string): Promise<boolean> {
    try {
      await this.playSound(soundName);
      return true;
    } catch (error) {
      console.error(`Test sound "${soundName}" failed:`, error);
      return false;
    }
  }

  // Get available sounds
  public getAvailableSounds(): string[] {
    return Array.from(this.sounds.keys());
  }

  // Load custom sound
  public async loadCustomSound(name: string, url: string): Promise<void> {
    try {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.volume = this.config.volume;
      
      // Wait for audio to load
      await new Promise((resolve, reject) => {
        audio.addEventListener("canplaythrough", resolve);
        audio.addEventListener("error", reject);
        audio.load();
      });
      
      this.sounds.set(name, audio);
    } catch (error) {
      console.error(`Failed to load custom sound "${name}":`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Export convenience functions
export const playMessageSound = () => soundManager.playMessageSound();
export const playCallSound = () => soundManager.playCallSound();
export const playNotificationSound = () => soundManager.playNotificationSound();
export const playTypingSound = () => soundManager.playTypingSound();
export const playMessageSent = () => soundManager.playMessageSent();
export const playMessageReceived = () => soundManager.playMessageReceived();
export const playCallAnswered = () => soundManager.playCallAnswered();
export const playCallEnded = () => soundManager.playCallEnded();
export const playCallMissed = () => soundManager.playCallMissed();
export const playRingtone = (ringtoneName?: string) => soundManager.playRingtone(ringtoneName);
export const stopAllSounds = () => soundManager.stopAllSounds();
export const setSoundVolume = (volume: number) => soundManager.setVolume(volume);
export const enableSounds = () => soundManager.enable();
export const disableSounds = () => soundManager.disable();
export const isSoundEnabled = () => soundManager.isEnabled();
export const getSoundVolume = () => soundManager.getVolume();
export const testSound = (soundName: string) => soundManager.testSound(soundName);
export const getAvailableSounds = () => soundManager.getAvailableSounds();
export const loadCustomSound = (name: string, url: string) => soundManager.loadCustomSound(name, url);