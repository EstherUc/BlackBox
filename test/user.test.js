import User from '../models/user.model.js';
import { users } from './helpers/loadFixtures.js';

describe('User - modelo Mongoose sin conectar a MongoDB', () => {
  test('los cinco usuarios de prueba cumplen el esquema', () => {
    expect(users).toHaveLength(5);
    users.forEach(data => expect(new User(data).validateSync()).toBeUndefined());
  });
  test('username es obligatorio', () => {
    expect(new User({ email: 'test@example.com', passwordHash: 'hash' }).validateSync().errors.username).toBeDefined();
  });
  test('rechaza emails no válidos', () => {
    expect(new User({ username: 'Prueba', email: 'correo_mal', passwordHash: 'hash' }).validateSync().errors.email).toBeDefined();
  });
  test('passwordHash es obligatorio', () => {
    expect(new User({ username: 'Prueba', email: 'prueba@example.com' }).validateSync().errors.passwordHash).toBeDefined();
  });
  test('el rol por defecto es user', () => {
    expect(new User({ username: 'Prueba', email: 'prueba@example.com', passwordHash: 'hash' }).role).toBe('user');
  });
  test('solo admite roles user y admin', () => {
    const doc = new User({ username: 'Prueba', email: 'prueba@example.com', passwordHash: 'hash', role: 'superuser' });
    expect(doc.validateSync().errors.role).toBeDefined();
  });
  test('passwordHash no se selecciona por defecto en consultas', () => {
    expect(User.schema.path('passwordHash').options.select).toBe(false);
  });
});