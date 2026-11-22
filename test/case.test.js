import Case from '../models/case.model.js';
import { cases } from './helpers/loadFixtures.js';
import { publicCaseSummary, publicEnigma, currentEnigma } from '../services/case.service.js';

describe('Case - expedientes y enigmas (sin BD)', () => {
  test('los seis casos reales validan con Mongoose', () => {
    expect(cases).toHaveLength(6);
    cases.forEach(data => expect(new Case(data).validateSync()).toBeUndefined());
  });
  test('cada caso contiene tres expedientes con tres enigmas', () => {
    for (const item of cases) {
      expect(item.files).toHaveLength(3);
      item.files.forEach(file => expect(file.enigmas).toHaveLength(3));
    }
  });
  test('el schema rechaza un caso que solo tiene dos expedientes', () => {
    const doc = new Case({ ...cases[0], files: cases[0].files.slice(0, 2) });
    expect(doc.validateSync().errors.files).toBeDefined();
  });
  test('el schema rechaza un expediente con dos enigmas', () => {
    const data = structuredClone(cases[0]);
    data.files[0].enigmas.pop();
    expect(new Case(data).validateSync()).toBeDefined();
  });
  test('rechaza un enigma sin respuesta interna', () => {
    const data = structuredClone(cases[0]);
    delete data.files[0].enigmas[0].answer;
    expect(new Case(data).validateSync()).toBeDefined();
  });
  test('el catálogo público no muestra enigmas ni soluciones', () => {
    const summary = publicCaseSummary(cases[0]);
    expect(summary.title).toBe(cases[0].title);
    expect(summary).not.toHaveProperty('files');
    expect(JSON.stringify(summary)).not.toContain('answer');
  });
  test('el enigma actual nunca revela answer ni explanation', () => {
    const enigma = currentEnigma(cases[0], { currentFile: 1, currentPuzzle: 1 });
    const publicData = publicEnigma(enigma);
    expect(publicData.code).toBe('C01-E01-P01');
    expect(publicData).not.toHaveProperty('answer');
    expect(publicData).not.toHaveProperty('explanation');
  });
  test('currentPuzzle apunta a enigmas[] y cambia según el expediente', () => {
    const enigma = currentEnigma(cases[0], { currentFile: 2, currentPuzzle: 1 });
    expect(enigma.code).toBe(cases[0].files[1].enigmas[0].code);
  });
  test('rechaza buscar un enigma fuera del progreso', () => {
    expect(() => currentEnigma(cases[0], { currentFile: 9, currentPuzzle: 9 })).toThrow();
  });
});