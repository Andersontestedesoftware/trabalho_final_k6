// Bibliotecas
const supertest = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');
const { describe, it } = require('mocha');

// Aplicação
const app = require('../../app');

// Serviços
const userService = require('../../service/userService');

// Testes

describe('Registro de usuário', () => {
  afterEach(() => sinon.restore());

  describe('POST /users/register', () => { 
    it('deve retornar 201 quando cadastro for bem-sucedido', async () => { 
      const userServiceMock = sinon.stub(userService, 'registerUser'); 
      userServiceMock.returns({ 
        username: "teste", 
        favorecidos: [ "string" ] 
      }); 

      const resposta = await supertest(app) 
        .post('/users/register') 
        .send({ 
          username: "teste", 
          password: "123456", 
          favorecidos: ["string"] 
        }); 

      expect(resposta.status).to.equal(201); 
      expect(resposta.body).to.have.property('username', 'teste'); 
      expect(resposta.body.favorecidos[0]).to.equal("string"); 
    });
  });
});


describe('Login de usuário', () => {
  afterEach(() => sinon.restore());
  describe('POST /users/login', () => {
    it('deve retornar 200 quando login for bem-sucedido', async () => {
      const userServiceMock = sinon.stub(userService, 'loginUser');
      userServiceMock.returns({
        username: "teste", 
        password: "123456", 
        favorecidos: ["string"],
        saldo: 10000
        
      });

      const resposta = await supertest(app)
        .post('/users/login')
        .send({
          username: "teste",
          password: "123456"
        });

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.have.property('username', 'teste');
      expect(resposta.body.favorecidos[0]).to.equal("string");
      expect(resposta.body).to.have.property('saldo', 10000);

    });

    it('deve retornar 400 quando usuário não encontrado', async () => {
      const userServiceMock = sinon.stub(userService, 'loginUser');
      userServiceMock.throws(new Error('Usuário não encontrado'));

      const resposta = await supertest(app)
        .post('/users/login')
        .send({
          username: "God of war",
          password: "123456"
        });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property('error', 'Usuário não encontrado');

    });

    it('deve retornar 400 quando senha inválida', async () => {
      const userServiceMock = sinon.stub(userService, 'loginUser');
      userServiceMock.throws(new Error('Senha inválida'));

      const resposta = await supertest(app)
        .post('/users/login')
        .send({
          username: "teste",
          password: "senhaerrada"
        });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property('error', 'Senha inválida');

    });

    it('deve retornar 400 quando usuário já existe', async () => {
      const userServiceMock = sinon.stub(userService, 'registerUser');
      userServiceMock.throws(new Error('Usuário já existe'));

      const resposta = await supertest(app)
        .post('/users/register')
        .send({
          username: "teste",
          password: "123456",
          favorecidos: []
        });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property('error', 'Usuário já existe');
    });
  });
});