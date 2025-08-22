const express = require('express');
const router = express.Router();
const userService = require('../service/userService');

router.post('/register', (req, res) => {
  const { username, password, favorecidos } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios para registrar o usuário' });
  try {
    const user = userService.registerUser({ username, password, favorecidos });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios para fazer login' });
  try {
    const user = userService.loginUser({ username, password });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  res.json(userService.listUsers());
});

module.exports = router;
