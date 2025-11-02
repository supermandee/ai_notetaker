import Database from 'better-sqlite3';
import path from 'path';
import { Meeting } from '../types';

export class DatabaseService {
  private db: Database.Database;

  constructor(userDataPath: string) {
    const dbPath = path.join(userDataPath, 'ai-notetaker.db');
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase() {
    // Create meetings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        audioFilePath TEXT NOT NULL,
        transcript TEXT,
        summary TEXT,
        status TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    // Create index on date for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date DESC)
    `);
  }

  saveMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO meetings (id, title, date, duration, audioFilePath, transcript, summary, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      meeting.title,
      meeting.date,
      meeting.duration,
      meeting.audioFilePath,
      meeting.transcript || null,
      meeting.summary || null,
      meeting.status,
      now,
      now
    );

    return id;
  }

  getMeeting(id: string): Meeting | null {
    const stmt = this.db.prepare('SELECT * FROM meetings WHERE id = ?');
    const row = stmt.get(id) as any;
    return row || null;
  }

  getAllMeetings(): Meeting[] {
    const stmt = this.db.prepare('SELECT * FROM meetings ORDER BY date DESC');
    return stmt.all() as Meeting[];
  }

  updateMeeting(id: string, updates: Partial<Meeting>): void {
    const fields = Object.keys(updates)
      .filter((key) => key !== 'id' && key !== 'createdAt')
      .map((key) => `${key} = ?`)
      .join(', ');

    const values = Object.keys(updates)
      .filter((key) => key !== 'id' && key !== 'createdAt')
      .map((key) => (updates as any)[key]);

    values.push(Date.now()); // updatedAt
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE meetings
      SET ${fields}, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(...values);
  }

  deleteMeeting(id: string): void {
    const stmt = this.db.prepare('DELETE FROM meetings WHERE id = ?');
    stmt.run(id);
  }

  private generateId(): string {
    return `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  close(): void {
    this.db.close();
  }
}
