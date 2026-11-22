import Session from '../models/session.model.js';
import { sessions, cases, users } from './helpers/loadFixtures.js';

describe('Session - modelo de partida (sin BD)', () => {
  test('las 12 partidas ficticias cumplen el esquema', () => {
    expect(sessions).toHaveLength(12);
    sessions.forEach(data => expect(new Session(data).validateSync()).toBeUndefined());
  });
  test('userId y caseId son referencias ObjectId', () => {
    expect(Session.schema.path('userId').options.ref).toBe('User');
    expect(Session.schema.path('caseId').options.ref).toBe('Case');
    const doc = new Session(sessions[0]);
    expect(doc.userId.toString()).toBe(users[0]._id);
    expect(doc.caseId.toString()).toBe(cases[0]._id);
  });
  test('no permite partidas sin usuario o sin caso', () => {
    const doc = new Session({ attempt: 1, currentFile: 1, currentPuzzle: 1, remainingLives: 6 });
    const error = doc.validateSync();
    expect(error.errors.userId).toBeDefined();
    expect(error.errors.caseId).toBeDefined();
  });
  test('el intento debe ser positivo', () => {
    expect(new Session({ ...sessions[0], attempt: 0 }).validateSync().errors.attempt).toBeDefined();
  });
  test('no permite más de seis vidas ni vidas negativas', () => {
    for (const lives of [-1, 7]) {
      expect(new Session({ ...sessions[0], remainingLives: lives }).validateSync().errors.remainingLives).toBeDefined();
    }
  });
  test('la posición dentro del expediente es de uno a tres', () => {
    expect(new Session({ ...sessions[0], currentPuzzle: 4 }).validateSync().errors.currentPuzzle).toBeDefined();
  });
  test('la puntuación está entre cero y seis', () => {
    expect(new Session({ ...sessions[0], pointsEarned: 7 }).validateSync().errors.pointsEarned).toBeDefined();
  });
  test('el estado solo admite active, completed y failed', () => {
    expect(new Session({ ...sessions[0], status: 'paused' }).validateSync().errors.status).toBeDefined();
  });
});