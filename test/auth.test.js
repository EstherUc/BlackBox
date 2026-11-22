import { jest } from "@jest/globals";
import jwt from 'jsonwebtoken';
import { authenticate, authorizeRoles, authorizeOwnerOrAdmin } from '../middlewares/auth.middleware.js';

function makeRes() {
  const res = {
    statusCode: 200,
    payload: undefined,
    status: jest.fn(function (code) { this.statusCode = code; return this; }),
    json: jest.fn(function (data) { this.payload = data; return this; })
  };
  return res;
}

describe('Autenticación y autorización con req/res simulados', () => {
  const SECRET = 'test-secret-local-nunca-usar-en-produccion';
  const previous = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = SECRET; });
  afterAll(() => { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; });

  test('sin Bearer Token devuelve 401', () => {
    const req = { headers: {} }, res = makeRes(), next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
  test('rechaza un token manipulado', () => {
    const req = { headers: { authorization: 'Bearer token-falso' } }, res = makeRes(), next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
  test('un JWT válido identifica al usuario', () => {
    const token = jwt.sign({ id: 'usuario1', role: 'user' }, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } }, res = makeRes(), next = jest.fn();
    authenticate(req, res, next);
    expect(req.user).toEqual({ id: 'usuario1', role: 'user' });
    expect(next).toHaveBeenCalledTimes(1);
  });
  test('un usuario no puede acceder a una ruta solo para admin', () => {
    const req = { user: { id: 'u1', role: 'user' } }, res = makeRes(), next = jest.fn();
    authorizeRoles('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
  test('el admin sí puede acceder a su ruta', () => {
    const req = { user: { id: 'a1', role: 'admin' } }, res = makeRes(), next = jest.fn();
    authorizeRoles('admin')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
  test('sin usuario autenticado el middleware de roles responde 401', () => {
    const res = makeRes(), next = jest.fn();
    authorizeRoles('admin')({}, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  test('el propietario de una partida puede consultarla', () => {
    const req = { user: { id: 'u1', role: 'user' }, sessionRecord: { userId: 'u1' } };
    const res = makeRes(), next = jest.fn();
    authorizeOwnerOrAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
  test('un usuario no puede consultar una partida de otra persona', () => {
    const req = { user: { id: 'u1', role: 'user' }, sessionRecord: { userId: 'u2' } };
    const res = makeRes(), next = jest.fn();
    authorizeOwnerOrAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
  test('el administrador puede consultar la partida de otro usuario', () => {
    const req = { user: { id: 'a1', role: 'admin' }, sessionRecord: { userId: 'u2' } };
    const res = makeRes(), next = jest.fn();
    authorizeOwnerOrAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
  test('si no se ha cargado la partida devuelve 404', () => {
    const req = { user: { id: 'u1', role: 'user' } }, res = makeRes(), next = jest.fn();
    authorizeOwnerOrAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});