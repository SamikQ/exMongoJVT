const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "Max Schwarz",
    email: "test@test.com",
    password: "testers",
  },
  {
    id: "u2",
    name: "Dmytro Samokhvalov",
    email: "samokhvalov@gmail.com",
    password: "password",
  },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const errors = validationResult(req); // передаємо реквест до функції Валідатору, яка перевірить, чи виконані умови, зазначені в роутсах
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }
  
  const { name, email, password } = req.body;

  const hasUser = DUMMY_USERS.find((user) => user.email === email);

  if (hasUser) {
    throw new HttpError("Couldnt create a user. email already exist!", 422);
  }

  const createdUser = {
    id: uuidv4(),
    name,
    email,
    password,
  };

  DUMMY_USERS.push(createdUser);
  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const indentifiedUser = DUMMY_USERS.find((user) => user.email === email);

  if (!indentifiedUser || indentifiedUser.password !== password) {
    throw new HttpError("wrong password or email!", 401);
  }

  res.json({ message: "loged in!" });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
